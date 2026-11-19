/**
 * Order reads. Converts Mongo order documents into the `Order` UI type.
 * With no database configured these return empty lists: fake orders are
 * never invented for real customers.
 */

import type { Order } from "@/types";
import { connectDB, hasDB } from "@/lib/db/mongoose";
import { OrderModel } from "@/models/Order";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function toOrder(d: any): Order {
  const id = String(d._id);
  return {
    id,
    orderNumber: d.orderNumber,
    customerName: d.customerName,
    customerEmail: d.customerEmail,
    date: new Date(d.createdAt).toISOString().slice(0, 10),
    status: d.status,
    paymentMethod: d.paymentMethod,
    paymentStatus: d.paymentStatus,
    advanceAmount: d.advanceAmount ?? 0,
    remainingAmount: d.remainingAmount ?? 0,
    codCollectedAt: d.codCollectedAt ? new Date(d.codCollectedAt).toISOString() : null,
    codCollectedBy: d.codCollectedBy ?? "",
    razorpayOrderId: d.razorpayOrderId ?? "",
    razorpayPaymentId: d.razorpayPaymentId ?? "",
    cashfreeOrderId: d.cashfreeOrderId ?? "",
    cashfreePaymentId: d.cashfreePaymentId ?? "",
    items: (d.items ?? []).map((i: any) => ({
      refId: i.refId,
      name: i.name,
      image: i.image,
      size: i.size ?? "",
      color: i.color ?? "",
      quantity: i.quantity,
      price: i.unitPrice,
      kind: i.kind,
      selections: i.selections,
    })),
    subtotal: d.subtotal,
    discount: d.discount ?? 0,
    shipping: d.shipping ?? 0,
    total: d.total,
    address: {
      id: `${id}-addr`,
      label: d.address?.label ?? "Delivery",
      fullName: d.address?.fullName ?? "",
      phone: d.address?.phone ?? "",
      line1: d.address?.line1 ?? "",
      line2: d.address?.line2 ?? "",
      city: d.address?.city ?? "",
      state: d.address?.state ?? "",
      pincode: d.address?.pincode ?? "",
      isDefault: false,
    },
    fulfillments: (d.fulfillments ?? []).map((f: any) => ({
      id: String(f._id),
      sourceSupplier: f.sourceSupplier,
      meeshoOrderId: f.meeshoOrderId,
      status: f.status,
      trackingId: f.trackingId || undefined,
      carrier: f.carrier || undefined,
      sourceCost: f.sourceCost ?? 0,
      placedAt: new Date(f.placedAt).toISOString(),
    })),
    estimatedProfit: d.estimatedProfit ?? 0,
    attribution: {
      source: d.attribution?.source ?? "direct",
      medium: d.attribution?.medium ?? "",
      campaign: d.attribution?.campaign ?? "",
      linkCode: d.attribution?.linkCode ?? "",
      landingPath: d.attribution?.landingPath ?? "",
    },
  };
}

function plain<T>(doc: unknown): T {
  return JSON.parse(JSON.stringify(doc)) as T;
}

export async function getOrdersForUser(userId: string): Promise<Order[]> {
  if (!hasDB() || !userId) return [];
  await connectDB();
  const docs = await OrderModel.find({ userId }).sort({ createdAt: -1 }).limit(100).lean();
  return plain<any[]>(docs).map(toOrder);
}

export async function getAllOrders(limit = 200): Promise<Order[]> {
  if (!hasDB()) return [];
  await connectDB();
  const docs = await OrderModel.find().sort({ createdAt: -1 }).limit(limit).lean();
  return plain<any[]>(docs).map(toOrder);
}
