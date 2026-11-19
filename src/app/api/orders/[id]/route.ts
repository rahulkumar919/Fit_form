/**
 * GET   /api/orders/[id]   — single order (owner or admin)
 * PATCH /api/orders/[id]   — update order (admin only)
 */

import { NextRequest } from "next/server";
import { connectDB, hasDB } from "@/lib/db/mongoose";
import { OrderModel } from "@/models/Order";
import { ok, notFound, forbidden, serverError } from "@/lib/api/response";
import { requireAuth, extractUserId, extractRole } from "@/lib/api/auth-guard";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const { id } = await params;
    const userId = extractUserId(session!);
    const role = extractRole(session!);

    if (hasDB()) {
      await connectDB();
      const order = await OrderModel.findById(id).lean();
      if (!order) return notFound("Order not found");
      if (role !== "admin" && String((order as { userId?: unknown }).userId) !== String(userId)) {
        return forbidden("You cannot view this order");
      }
      return ok(order);
    }

    return notFound("Order not found");
  } catch (err) {
    return serverError(err);
  }
}
