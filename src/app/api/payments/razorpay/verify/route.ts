/**
 * POST /api/payments/razorpay/verify
 * Called by the browser after Razorpay checkout succeeds.
 *
 * Works for both authenticated customers and guests (no session required).
 * Looks up the order by _id only (userId not required since guests have null userId).
 * Verifies the HMAC-SHA256 signature — never trusts the browser for payment status.
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongoose";
import { OrderModel } from "@/models/Order";
import { badRequest, notFound, ok, serverError } from "@/lib/api/response";
import { verifyPaymentSignature } from "@/lib/payments/razorpay";
import { recordEvents } from "@/lib/tracking/record";
import { sendOrderConfirmationEmail, orderToEmailData } from "@/lib/email";
import { OBJECT_ID_RE } from "@/lib/catalog-constants";

const schema = z.object({
  orderId: z.string().regex(OBJECT_ID_RE),
  razorpay_order_id: z.string().min(1).max(64),
  razorpay_payment_id: z.string().min(1).max(64),
  razorpay_signature: z.string().min(1).max(256),
});

export async function POST(req: NextRequest) {
  try {
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return badRequest("Invalid payload");
    const p = parsed.data;

    await connectDB();

    // Look up by _id only — works for both authenticated and guest orders.
    const order = await OrderModel.findById(p.orderId);
    if (!order) return notFound("Order not found");
    if (order.razorpayOrderId !== p.razorpay_order_id) return badRequest("Payment does not match this order");

    // Prevent one Razorpay order from settling two MongoDB orders (tampered refId attack).
    if ((await OrderModel.countDocuments({ razorpayOrderId: p.razorpay_order_id })) !== 1) {
      return badRequest("Payment does not match this order");
    }

    if (!verifyPaymentSignature(p.razorpay_order_id, p.razorpay_payment_id, p.razorpay_signature)) {
      return badRequest("Payment signature verification failed");
    }

    if (order.paymentStatus !== "paid") {
      // Partial COD: advance verified — mark as partially_paid, not fully paid
      const isPartialCod = order.paymentMethod === "partial_cod";
      order.paymentStatus = isPartialCod ? "partially_paid" : "paid";
      order.razorpayPaymentId = p.razorpay_payment_id;
      await order.save();

      const a = order.attribution;
      await recordEvents([{
        type: "purchase",
        vid: a?.visitorId ?? "",
        sid: a?.sessionId ?? "",
        path: "/checkout",
        source: a?.source ?? "direct",
        medium: a?.medium ?? "",
        campaign: a?.campaign ?? "",
        linkCode: a?.linkCode ?? "",
        value: order.total,
        orderId: String(order._id),
      }]);

      // Send confirmation email (idempotent — skipped if emailSentAt already set)
      if (!order.emailSentAt) {
        const isGuest = !order.userId;
        const sent = await sendOrderConfirmationEmail(orderToEmailData(order, isGuest));
        if (sent) {
          await OrderModel.updateOne({ _id: order._id }, { $set: { emailSentAt: new Date() } });
        }
      }
    }

    return ok({
      verified: true,
      orderNumber: order.orderNumber,
      guestTrackingToken: order.guestTrackingToken ?? null,
    });
  } catch (err) {
    return serverError(err);
  }
}
