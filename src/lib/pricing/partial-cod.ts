/**
 * Server-side Partial COD advance calculation.
 * All arithmetic is done in paise (integer) to avoid floating-point errors,
 * then converted back to rupees for storage.
 *
 * Rules:
 *  - advanceType "percentage": advance = ceil(total × pct / 100), rounded to nearest rupee
 *  - advanceType "fixed":      advance = the configured flat amount
 *  - advance is floored to minAdvanceAmount if below it
 *  - advance can never exceed the order total
 *  - remaining = total - advance  (always ≥ 0)
 */

import type { PartialCodSettings } from "@/services/settings";

export interface AdvanceBreakdown {
  /** Advance charged online via Razorpay (₹, 2dp) */
  advance: number;
  /** Remaining owed at delivery (₹, 2dp) */
  remaining: number;
  /** Paise value for Razorpay createOrder (integer) */
  advancePaise: number;
}

/**
 * Returns null when Partial COD is unavailable for this order
 * (disabled, below min, above max, or Razorpay not the active gateway).
 */
export function getPartialCodBreakdown(
  orderTotal: number,
  pc: PartialCodSettings,
  activeGateway: string,
): AdvanceBreakdown | null {
  if (!pc.enabled) return null;
  // Requires Razorpay for the advance
  if (activeGateway !== "razorpay") return null;
  if (orderTotal < pc.minOrderAmount) return null;
  if (pc.maxOrderAmount > 0 && orderTotal > pc.maxOrderAmount) return null;

  // Calculate raw advance in paise to avoid floating-point
  const totalPaise = Math.round(orderTotal * 100);
  let advancePaise: number;

  if (pc.advanceType === "percentage") {
    // ceil so the advance is never below the percentage (favours the store)
    advancePaise = Math.ceil((totalPaise * pc.advanceValue) / 100);
  } else {
    advancePaise = Math.round(pc.advanceValue * 100);
  }

  // Apply minimum advance floor
  const minPaise = Math.round(pc.minAdvanceAmount * 100);
  if (advancePaise < minPaise) advancePaise = minPaise;

  // Advance can never exceed the order total
  if (advancePaise >= totalPaise) advancePaise = totalPaise;

  const advance = advancePaise / 100;
  const remaining = Math.round((totalPaise - advancePaise)) / 100;

  return { advance, remaining, advancePaise };
}

/**
 * Verifies that the Razorpay amount (paise) matches the expected advance.
 * Used in the verify route — never trust the browser.
 */
export function verifyAdvanceAmount(
  paidPaise: number,
  expectedBreakdown: AdvanceBreakdown,
): boolean {
  return paidPaise === expectedBreakdown.advancePaise;
}
