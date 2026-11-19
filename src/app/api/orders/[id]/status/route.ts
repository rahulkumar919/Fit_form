/** PATCH /api/orders/[id]/status — admin updates order status */

import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { OrderModel } from "@/models/Order";
import { ok, notFound, serverError, zodError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/api/auth-guard";
import { updateOrderStatusSchema } from "@/lib/validations/order";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;
    const body = await req.json();
    const parsed = updateOrderStatusSchema.safeParse(body);
    if (!parsed.success) return zodError(parsed.error);

    await connectDB();
    const order = await OrderModel.findByIdAndUpdate(
      id,
      { $set: { status: parsed.data.status, ...(parsed.data.notes ? { notes: parsed.data.notes } : {}) } },
      { new: true },
    ).lean();
    if (!order) return notFound("Order not found");

    return ok(order);
  } catch (err) {
    return serverError(err);
  }
}
