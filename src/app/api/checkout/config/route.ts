/**
 * GET /api/checkout/config
 * Returns payment availability config for the checkout page.
 * Public endpoint — no auth required. Never returns secrets.
 */

import { ok, serverError } from "@/lib/api/response";
import { getSettings } from "@/services/settings";
import { razorpayConfigured } from "@/lib/payments/razorpay";
import { cashfreeConfigured } from "@/lib/payments/cashfree";

export async function GET() {
  try {
    const s = await getSettings();
    const razorpayActive = s.activeGateway === "razorpay" && razorpayConfigured();
    return ok({
      codEnabled: s.codEnabled,
      activeGateway: s.activeGateway,
      onlineEnabled:
        s.activeGateway === "razorpay" ? razorpayActive :
        s.activeGateway === "cashfree" ? (s.activeGateway === "cashfree" && cashfreeConfigured()) :
        false,
      partialCod: {
        enabled: s.partialCod.enabled && razorpayActive,
        advanceType: s.partialCod.advanceType,
        advanceValue: s.partialCod.advanceValue,
        minOrderAmount: s.partialCod.minOrderAmount,
        maxOrderAmount: s.partialCod.maxOrderAmount,
        minAdvanceAmount: s.partialCod.minAdvanceAmount,
      },
    });
  } catch (err) {
    return serverError(err);
  }
}
