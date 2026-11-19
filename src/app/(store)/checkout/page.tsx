   import type { Metadata } from "next";
import { CheckoutClient } from "@/components/checkout/checkout-client";
import { cashfreeConfigured } from "@/lib/payments/cashfree";
import { razorpayConfigured } from "@/lib/payments/razorpay";
import { getSettings } from "@/services/settings";
import { getPartialCodBreakdown } from "@/lib/pricing/partial-cod";
import { auth } from "@/lib/auth/auth";
import { extractUserId } from "@/lib/api/auth-guard";
import { getSavedAddresses } from "@/services/customer";

export const metadata: Metadata = {
  title: "Checkout | FitAndForm",
  description: "Complete your FitAndForm order securely. Online payment available.",
  alternates: { canonical: "/checkout" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const [settings, session] = await Promise.all([getSettings(), auth()]);
  const addresses = session ? await getSavedAddresses(extractUserId(session)) : [];
  const saved = addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;

  const gw = settings.activeGateway ?? "cashfree";
  const razorpayReady = razorpayConfigured();
  const onlineEnabled =
    gw === "cashfree" ? cashfreeConfigured() :
      gw === "razorpay" ? razorpayReady :
        false;

  // Partial COD is only available when Razorpay is active + configured + admin enabled
  const partialCodEnabled =
    settings.partialCod.enabled && gw === "razorpay" && razorpayReady;

  return (
    <CheckoutClient
      onlinePaymentEnabled={onlineEnabled}
      activeGateway={gw}
      savedAddress={saved}
      partialCodSettings={partialCodEnabled ? settings.partialCod : null}
    />
  );
}
