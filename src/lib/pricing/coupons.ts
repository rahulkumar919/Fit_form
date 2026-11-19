/**
 * Single source of truth for coupon rules, shared by /api/coupons/validate (preview)
 * and the checkout price calculator (authoritative).
 */
import { connectDB, hasDB } from "@/lib/db/mongoose";
import { CouponModel } from "@/models/Coupon";
import { OrderModel } from "@/models/Order";
import { COUPONS } from "@/lib/data/store";
import { OBJECT_ID_RE } from "@/lib/catalog-constants";
import { cache } from "@/lib/redis/client";

export interface CouponRule {
  code: string;
  description: string;
  type: "percentage" | "flat" | string;
  value: number;
  minSubtotal?: number;
  maxDiscount?: number | null;
  firstOrderOnly?: boolean;
}

export type CouponCheck =
  | { ok: true; coupon: CouponRule; discount: number }
  | { ok: false; message: string };

/** Active, unexpired coupon with uses left, or null. `null` fields count as "no limit". */
export async function findActiveCoupon(code: string): Promise<CouponRule | null> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;
  if (!hasDB()) {
    return (COUPONS.find((c) => c.code.toUpperCase() === normalized) as CouponRule | undefined) ?? null;
  }

  // Cache active coupons for 5 minutes — the StoreLayout calls this on every page render
  const cacheKey = `coupon:${normalized}`;
  const hit = await cache.get(cacheKey);
  if (hit !== null) return hit === "null" ? null : JSON.parse(hit) as CouponRule;

  await connectDB();
  const now = new Date();
  const coupon = await CouponModel.findOne({
    code: normalized,
    isActive: true,
    $and: [
      { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] },
      { $or: [{ usageLimit: null }, { $expr: { $lt: ["$usageCount", "$usageLimit"] } }] },
    ],
  }).lean<CouponRule>();

  // Cache the result (including null — "not found") for 5 minutes
  await cache.set(cacheKey, coupon ? JSON.stringify(coupon) : "null", 300);
  return coupon;
}

export function discountFor(coupon: CouponRule, subtotal: number): number {
  if (coupon.type === "flat") return Math.min(coupon.value, subtotal);
  const raw = Math.round((subtotal * coupon.value) / 100);
  return coupon.maxDiscount ? Math.min(raw, coupon.maxDiscount) : raw;
}

/** True when the customer already has an order that wasn't cancelled. */
async function hasPriorOrder(userId: string): Promise<boolean> {
  if (!hasDB() || !OBJECT_ID_RE.test(userId)) return false;
  await connectDB();
  return !!(await OrderModel.exists({ userId, status: { $ne: "cancelled" } }));
}

/**
 * Full eligibility check. `userId` is required to enforce first-order-only coupons;
 * without it (guest preview) such coupons are shown but re-checked at checkout.
 */
export async function checkCoupon(code: string, subtotal: number, userId?: string): Promise<CouponCheck> {
  const coupon = await findActiveCoupon(code);
  if (!coupon) return { ok: false, message: "This coupon is invalid or has expired" };
  const min = coupon.minSubtotal ?? 0;
  if (subtotal < min) return { ok: false, message: `Minimum order ₹${min.toLocaleString("en-IN")} required for this coupon` };
  if (coupon.firstOrderOnly && userId && (await hasPriorOrder(userId))) {
    return { ok: false, message: "This coupon is only valid on your first order" };
  }
  return { ok: true, coupon, discount: discountFor(coupon, subtotal) };
}
