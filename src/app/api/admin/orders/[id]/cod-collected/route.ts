/**
 * POST /api/admin/orders/[id]/cod-collected
 * Admin marks the remaining COD amount as collected at delivery.
 *
 * Rules:
 *  - Order must be partial_cod with paymentStatus "partially_paid"
 *  - Order must be in a delivered state (or at least not cancelled)
 *  - Cannot be called twice (codCollectedAt idempotency guard)
 *  - Records admin email, timestamp
 */

import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { OrderModel } from "@/models/Order";
import { badRequest, notFound, ok, serverError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/api/auth-guard";
import { logAdminAction } from "@/lib/audit";
import { OBJECT_ID_RE } from "@/lib/catalog-constants";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Ctx) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;
    const { id } = await params;
    if (!OBJECT_ID_RE.test(id)) return notFound("Order not found");

    await connectDB();
    const order = await OrderModel.findById(id);
    if (!order) return notFound("Order not found");

    if (order.paymentMethod !== "partial_cod") {
      return badRequest("This action is only available for Partial COD orders");
    }
    if (order.paymentStatus !== "partially_paid") {
      return badRequest("Advance payment has not been verified for this order");
    }
    if (order.codCollectedAt) {
      return badRequest(
        `Remaining amount was already marked as collected on ${new Date(order.codCollectedAt).toLocaleDateString("en-IN")}`,
      );
    }
    if (order.status === "cancelled" || order.status === "returned") {
      return badRequest("Cannot collect payment on a cancelled or returned order");
    }

    const adminEmail = session!.user?.email ?? "admin";
    order.paymentStatus = "paid";
    order.codCollectedAt = new Date();
    order.codCollectedBy = adminEmail;
    await order.save();

    await logAdminAction(
      session!,
      "order.cod_collected",
      "order",
      id,
      `Remaining ₹${order.remainingAmount} collected for ${order.orderNumber}`,
    );

    return ok({
      orderNumber: order.orderNumber,
      remainingAmount: order.remainingAmount,
      codCollectedAt: order.codCollectedAt.toISOString(),
      codCollectedBy: adminEmail,
    });
  } catch (err) {
    return serverError(err);
  }
}
