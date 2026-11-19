/**
 * GET  /api/orders   — customer's own orders
 * POST /api/orders   — create order (price-verified server-side)
 */

import { NextRequest } from "next/server";
import { connectDB, hasDB } from "@/lib/db/mongoose";
import { OrderModel, generateOrderNumber } from "@/models/Order";
import { calculateOrderPrices } from "@/lib/pricing/calculator";
import { ok, created, serverError, zodError } from "@/lib/api/response";
import { requireAuth, requireAdmin, extractUserId, extractRole } from "@/lib/api/auth-guard";
import { createOrderSchema } from "@/lib/validations/order";
import { ORDERS } from "@/lib/data/admin";

export async function GET(req: NextRequest) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const userId = extractUserId(session!);

    if (hasDB()) {
      await connectDB();
      const orders = await OrderModel.find({ userId })
        .sort({ createdAt: -1 })
        .lean();
      return ok(orders);
    }

    // Mock fallback — return static orders
    return ok(ORDERS.filter(o => o.customerEmail === session!.user?.email));
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const body = await req.json();
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) return zodError(parsed.error);

    const { items, couponCode, paymentMethod, razorpayOrderId, fullName, email, phone, line1, line2, city, state, pincode } = parsed.data;

    // ⚑ CRITICAL: Always verify prices server-side
    const pricing = await calculateOrderPrices(items as any, couponCode);

    const userId = extractUserId(session!);

    if (hasDB()) {
      await connectDB();

      const orderDoc = await OrderModel.create({
        orderNumber: generateOrderNumber(),
        userId,
        customerName: fullName,
        customerEmail: email,
        paymentMethod,
        paymentStatus: "pending" as const,
        razorpayOrderId,
        items: pricing.items as any[],
        address: { label: "Delivery", fullName, phone, line1, line2: line2 ?? "", city, state, pincode },
        couponCode: couponCode ?? "",
        subtotal: pricing.subtotal,
        discount: pricing.discount,
        shipping: pricing.shipping,
        total: pricing.total,
        estimatedProfit: 0,
      });

      return created({ orderNumber: orderDoc.orderNumber, total: orderDoc.total, id: String(orderDoc._id) });
    }

    // Mock: return fake order number
    return created({ orderNumber: generateOrderNumber(), total: pricing.total, id: "mock_id" });
  } catch (err) {
    return serverError(err);
  }
}
