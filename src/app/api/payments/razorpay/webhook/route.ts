/**
 * POST /api/payments/razorpay/webhook
 * Server-to-server confirmation from Razorpay.
 * Requires RAZORPAY_WEBHOOK_SECRET; checks paid amount matches order total.
 * Idempotent: emailSentAt guards against duplicate confirmation emails.
 */

import { NextRequest } from "next/server";
import { connectDB, hasDB } from "@/lib/db/mongoose";
import { OrderModel } from "@/models/Order";
import { badRequest, ok, serverError } from "@/lib/api/response";
import { verifyWebhookSignature } from "@/lib/payments/razorpay";
import { recordEvents } from "@/lib/tracking/record";
import { sendOrderConfirmationEmail, orderToEmailData } from "@/lib/email";

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    if (raw.length > 200_000) return badRequest("Payload too large");
    if (!verifyWebhookSignature(raw, req.headers.get("x-razorpay-signature") ?? "")) {
      return badRequest("Invalid webhook signature");
    }
    if (!hasDB()) return ok({ received: true });

    const event = JSON.parse(raw);
    const payment = event?.payload?.payment?.entity;
    const rzpOrderId: string | undefined = payment?.order_id;
    if (!rzpOrderId) return ok({ received: true });

    await connectDB();
    const matches: any[] = await OrderModel.find({ razorpayOrderId: rzpOrderId }).limit(2);
    if (matches.length !== 1) {
      if (matches.length > 1) console.warn(`[razorpay] ${rzpOrderId} attached to multiple orders; skipped`);
      return ok({ received: true });
    }
    const order = matches[0];

    switch (event.event) {
      case "payment.captured":
      case "order.paid": {
        if (Number(payment.amount) !== Math.round(order.total * 100)) {
          order.notes = `${order.notes ?? ""} Razorpay amount mismatch: got ${payment.amount} paise.`.trim();
          await order.save();
          break;
        }
        if (order.paymentStatus !== "paid" && order.paymentStatus !== "partially_paid") {
          const isPartialCod = order.paymentMethod === "partial_cod";
          order.paymentStatus = isPartialCod ? "partially_paid" : "paid";
          order.razorpayPaymentId = payment.id;
          await order.save();

          const a = order.attribution ?? {};
          await recordEvents([{
            type: "purchase",
            vid: a.visitorId ?? "",
            sid: a.sessionId ?? "",
            path: "/checkout",
            source: a.source ?? "direct",
            medium: a.medium ?? "",
            campaign: a.campaign ?? "",
            linkCode: a.linkCode ?? "",
            value: order.total,
            orderId: String(order._id),
          }]);
        }

        // Send confirmation email (idempotent — emailSentAt guards duplicates)
        if (!order.emailSentAt) {
          const isGuest = !order.userId;
          const sent = await sendOrderConfirmationEmail(orderToEmailData(order, isGuest));
          if (sent) {
            await OrderModel.updateOne({ _id: order._id }, { $set: { emailSentAt: new Date() } });
          }
        }
        break;
      }
      case "payment.failed":
        if (order.paymentStatus === "pending") {
          order.paymentStatus = "failed";
          await order.save();
        }
        break;
      case "refund.processed":
        order.paymentStatus = "refunded";
        await order.save();
        break;
    }

    return ok({ received: true });
  } catch (err) {
    return serverError(err);
  }
}
