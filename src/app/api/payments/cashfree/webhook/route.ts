/**
 * POST /api/payments/cashfree/webhook — server-to-server event from Cashfree.
 * Dashboard → Payment Gateway → Webhooks → add this URL.
 * Events to subscribe: ORDER_PAID, PAYMENT_FAILED, REFUND_PROCESSED.
 * Requires CASHFREE_WEBHOOK_SECRET environment variable.
 */
import { NextRequest } from "next/server";
import { connectDB, hasDB } from "@/lib/db/mongoose";
import { OrderModel } from "@/models/Order";
import { ok, serverError } from "@/lib/api/response";
import { verifyCashfreeWebhook } from "@/lib/payments/cashfree";
import { recordEvents } from "@/lib/tracking/record";

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    if (raw.length > 100_000) return ok({ received: true });

    const sig = req.headers.get("x-webhook-signature") ?? "";
    if (!verifyCashfreeWebhook(raw, sig)) {
      return new Response("Invalid signature", { status: 401 });
    }

    if (!hasDB()) return ok({ received: true });

    let event: any;
    try { event = JSON.parse(raw); } catch { return ok({ received: true }); }

    const eventType: string = event?.type ?? "";
    const data = event?.data ?? {};
    const cfOrderId: string = data?.order?.cf_order_id ?? data?.cf_order_id ?? "";
    const orderAmount: number = Number(data?.order?.order_amount ?? data?.order_amount ?? 0);
    if (!cfOrderId) return ok({ received: true });

    await connectDB();
    const order: any = await OrderModel.findOne({ cashfreeOrderId: cfOrderId });
    if (!order) return ok({ received: true });

    switch (eventType) {
      case "PAYMENT_SUCCESS":
      case "ORDER_PAID": {
        if (Math.abs(orderAmount - order.total) > 1) {
          order.notes = `${order.notes ?? ""} Cashfree amount mismatch: got ₹${orderAmount}.`.trim();
          await order.save();
          break;
        }
        if (order.paymentStatus !== "paid") {
          order.paymentStatus = "paid";
          order.cashfreePaymentId = data?.payment?.cf_payment_id ?? "";
          await order.save();
          const a = order.attribution ?? {};
          await recordEvents([{
            type: "purchase", vid: a.visitorId ?? "", sid: a.sessionId ?? "", path: "/checkout",
            source: a.source ?? "direct", medium: a.medium ?? "", campaign: a.campaign ?? "", linkCode: a.linkCode ?? "",
            value: order.total, orderId: String(order._id),
          }]);
        }
        break;
      }
      case "PAYMENT_FAILED":
        if (order.paymentStatus === "pending") {
          order.paymentStatus = "failed";
          await order.save();
        }
        break;
      case "REFUND_PROCESSED":
        order.paymentStatus = "refunded";
        await order.save();
        break;
    }
    return ok({ received: true });
  } catch (err) {
    return serverError(err);
  }
}
