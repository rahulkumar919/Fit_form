/**
 * POST /api/orders/[id]/cancel — a customer cancels their own order while it is still "new"
 * (before it has been sourced from the supplier). Paid online orders are flagged for refund.
 */

import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { OrderModel } from "@/models/Order";
import { badRequest, notFound, ok, serverError } from "@/lib/api/response";
import { extractUserId, requireAuth } from "@/lib/api/auth-guard";
import { OBJECT_ID_RE } from "@/lib/catalog-constants";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Ctx) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;
    const { id } = await params;
    if (!OBJECT_ID_RE.test(id)) return notFound("Order not found");

    await connectDB();
    const order = await OrderModel.findOne({ _id: id, userId: extractUserId(session!) });
    if (!order) return notFound("Order not found");
    if (order.status !== "new") {
      return badRequest("This order is already being prepared and can no longer be cancelled online. Please contact support.");
    }
    order.status = "cancelled";
    if (order.paymentStatus === "paid") order.notes = `${order.notes ?? ""} Cancelled by customer: REFUND DUE.`.trim();
    else order.notes = `${order.notes ?? ""} Cancelled by customer.`.trim();
    await order.save();
    return ok({ id, status: order.status, refundDue: order.paymentStatus === "paid" });
  } catch (err) {
    return serverError(err);
  }
}
