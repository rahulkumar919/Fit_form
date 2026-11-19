/**
 * POST /api/payments/cashfree
 * Verify payment after Cashfree redirects back to /checkout/return.
 *
 * Works for both authenticated customers and guests (no session required).
 * Fetches real payment status from Cashfree — never trusts the browser.
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongoose";
import { OrderModel } from "@/models/Order";
import { badRequest, notFound, ok, serverError } from "@/lib/api/response";
import { getCashfreeOrder } from "@/lib/payments/cashfree";
import { recordEvents } from "@/lib/tracking/record";
import { sendOrderConfirmationEmail, orderToEmailData } from "@/lib/email";
import { OBJECT_ID_RE } from "@/lib/catalog-constants";

const schema = z.object({
  orderId: z.string().regex(OBJECT_ID_RE, "Invalid order id"),
  cfOrderId: z.string().min(1).max(80),
});

export async function POST(req: NextRequest) {
  try {
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return badRequest("Invalid payload");
    const { orderId } = parsed.data;

    await connectDB();

    // Look up by _id only — no userId filter so guests work too.
    const order = await OrderModel.findOne({
      _id: orderId,
      paymentMethod: "cashfree",
    });
    if (!order) return notFound("Order not found");

    // Fetch real status from Cashfree — never trust the browser.
    const lookupId = order.cashfreeOrderId || order.orderNumber;
    const cfOrder = await getCashfreeOrder(lookupId);

    if (cfOrder.status !== "PAID") {
      return ok({ paid: false, status: cfOrder.status, orderNumber: order.orderNumber });
    }

    // Amount sanity check
    const paidAmount = cfOrder.order_amount;
    if (Math.abs(paidAmount - order.total) > 1) {
      order.notes = `${order.notes ?? ""} Cashfree amount mismatch: got ₹${paidAmount}, expected ₹${order.total}`.trim();
      await order.save();
      return ok({ paid: false, status: "AMOUNT_MISMATCH", orderNumber: order.orderNumber });
    }

    if (order.paymentStatus !== "paid") {
      order.paymentStatus = "paid";
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

      // Send confirmation email (idempotent)
      if (!order.emailSentAt) {
        const isGuest = !order.userId;
        const sent = await sendOrderConfirmationEmail(orderToEmailData(order, isGuest));
        if (sent) {
          await OrderModel.updateOne({ _id: order._id }, { $set: { emailSentAt: new Date() } });
        }
      }
    }

    return ok({
      paid: true,
      orderNumber: order.orderNumber,
      guestTrackingToken: order.guestTrackingToken ?? null,
    });
  } catch (err) {
    return serverError(err);
  }
}
