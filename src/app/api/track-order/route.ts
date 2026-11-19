/**
 * GET /api/track-order?token=UUID
 * POST /api/track-order  { orderNumber, email }
 *
 * Two lookup modes:
 *  1. Token-based  — guest tracking link from the confirmation email (?token=UUID)
 *  2. Manual       — customer enters order number + email (works for both guests and registered)
 *
 * Security:
 *  - Token must be a valid UUID and must match a document with guestTrackingToken.
 *  - Manual lookup: order number + email must both match (case-insensitive email).
 *  - Only safe fields are returned — no payment secrets, no internal IDs beyond orderNumber.
 *  - Rate-limited to prevent brute-force enumeration.
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB, hasDB } from "@/lib/db/mongoose";
import { OrderModel } from "@/models/Order";
import { badRequest, notFound, ok, serverError } from "@/lib/api/response";
import { rateLimited } from "@/lib/tracking/record";

/* eslint-disable @typescript-eslint/no-explicit-any */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ORDER_NUM_RE = /^FF-\d{5}$/i;

/** Only expose these fields to the public tracking page. */
function safeOrder(d: any) {
  return {
    orderNumber: d.orderNumber,
    status: d.status,
    paymentMethod: d.paymentMethod,
    paymentStatus: d.paymentStatus,
    createdAt: new Date(d.createdAt).toISOString(),
    items: (d.items ?? []).map((i: any) => ({
      name: i.name,
      image: i.image ?? "",
      size: i.size ?? "",
      color: i.color ?? "",
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      kind: i.kind ?? "product",
    })),
    subtotal: d.subtotal,
    discount: d.discount ?? 0,
    shipping: d.shipping ?? 0,
    total: d.total,
    address: {
      fullName: d.address?.fullName ?? "",
      city: d.address?.city ?? "",
      state: d.address?.state ?? "",
      pincode: d.address?.pincode ?? "",
    },
    // Partial COD fields (safe to expose — customer needs to know what to pay)
    advanceAmount: (d.advanceAmount as number | undefined) ?? undefined,
    remainingAmount: (d.remainingAmount as number | undefined) ?? undefined,
    codCollectedAt: d.codCollectedAt ? new Date(d.codCollectedAt as Date).toISOString() : null,
    trackingId: d.fulfillments?.[0]?.trackingId ?? null,
    carrier: d.fulfillments?.[0]?.carrier ?? null,
  };
}

/* ── Token-based lookup (GET) ── */
export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    if (rateLimited(`track:${ip}`, 20)) return badRequest("Too many requests. Please slow down.");

    const token = req.nextUrl.searchParams.get("token") ?? "";
    if (!UUID_RE.test(token)) return badRequest("Invalid tracking token");
    if (!hasDB()) return notFound("Order not found");

    await connectDB();
    const order = await OrderModel.findOne({ guestTrackingToken: token }).lean();
    if (!order) return notFound("Order not found");

    return ok(safeOrder(order));
  } catch (err) {
    return serverError(err);
  }
}

/* ── Manual lookup (POST) ── */
const manualSchema = z.object({
  orderNumber: z.string().trim().regex(ORDER_NUM_RE, "Enter a valid order number (e.g. FF-12345)"),
  email: z.string().trim().email("Enter a valid email address"),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    if (rateLimited(`track:${ip}`, 20)) return badRequest("Too many requests. Please slow down.");

    const parsed = manualSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid request");
    const { orderNumber, email } = parsed.data;

    if (!hasDB()) return notFound("Order not found");
    await connectDB();

    const order = await OrderModel.findOne({
      orderNumber: orderNumber.toUpperCase(),
      customerEmail: email.toLowerCase(),
    }).lean();
    if (!order) return notFound("No order found with that order number and email address.");

    return ok(safeOrder(order));
  } catch (err) {
    return serverError(err);
  }
}
