/**
 * Server-side price calculator.
 * NEVER trust client-submitted prices — always fetch the authoritative
 * price from the database here and recalculate.
 */

import type { CartItem } from "@/types";
import { connectDB, hasDB } from "@/lib/db/mongoose";
import { ProductModel } from "@/models/Product";
import { ComboModel } from "@/models/Combo";
import { PRODUCTS, COMBOS } from "@/lib/data/store";
import { checkCoupon } from "@/lib/pricing/coupons";

import { getSettings } from "@/services/settings";

export interface PriceCalculation {
  items: { refId: string; kind: string; name: string; image: string; size: string; color: string; quantity: number; unitPrice: number; selections?: CartItem["selections"] }[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  couponApplied: boolean;
  /** Why a submitted coupon was not applied (empty when applied or none given). */
  couponMessage: string;
}

/** Fetch authoritative unit price for a single item from DB or mock. */
async function getUnitPrice(kind: "product" | "combo", refId: string): Promise<number> {
  if (hasDB()) {
    await connectDB();
    if (kind === "product") {
      const p = await ProductModel.findOne({ _id: refId }).select("price").lean().catch(() => null)
             ?? await ProductModel.findOne({ slug: refId }).select("price").lean().catch(() => null);
      if (p) return (p as { price: number }).price;
    } else {
      const c = await ComboModel.findOne({ _id: refId }).select("comboPrice").lean().catch(() => null)
             ?? await ComboModel.findOne({ slug: refId }).select("comboPrice").lean().catch(() => null);
      if (c) return (c as { comboPrice: number }).comboPrice;
    }
    // With a real DB, never fall back to mock prices — unknown items are rejected.
    throw new Error(`Price not found for ${kind} ${refId}`);
  }

  // Fallback to mock data (local dev without a database only)
  if (kind === "product") {
    const p = PRODUCTS.find(x => x.id === refId || x.slug === refId);
    if (p) return p.price;
  } else {
    const c = COMBOS.find(x => x.id === refId || x.slug === refId);
    if (c) return c.comboPrice;
  }

  throw new Error(`Price not found for ${kind} ${refId}`);
}

/** Re-calculate all prices from authoritative DB data. */
export async function calculateOrderPrices(
  items: CartItem[],
  couponCode?: string,
  opts: { userId?: string } = {},
): Promise<PriceCalculation> {
  const calculatedItems = await Promise.all(
    items.map(async (item) => {
      const unitPrice = await getUnitPrice(item.kind, item.refId);
      return {
        refId: item.refId,
        kind: item.kind,
        name: item.name,
        image: item.image,
        size: item.size ?? "",
        color: item.color ?? "",
        quantity: item.quantity,
        unitPrice,
        selections: item.selections,
      };
    }),
  );

  const subtotal = calculatedItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  // Validate and apply coupon (shared rules: expiry, usage limit, minimum, first-order-only)
  let discount = 0;
  let couponApplied = false;
  let couponMessage = "";
  if (couponCode?.trim()) {
    const check = await checkCoupon(couponCode, subtotal, opts.userId);
    if (check.ok) {
      discount = check.discount;
      couponApplied = true;
    } else {
      couponMessage = check.message;
    }
  }

  const { freeShippingThreshold, flatShipping } = await getSettings();
  const afterDiscount = subtotal - discount;
  const shipping = afterDiscount >= freeShippingThreshold ? 0 : flatShipping;
  const total = afterDiscount + shipping;

  return { items: calculatedItems, subtotal, discount, shipping, total, couponApplied, couponMessage };
}
