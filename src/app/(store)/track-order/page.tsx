import type { Metadata } from "next";
import { Suspense } from "react";
import { TrackOrderClient } from "@/components/checkout/track-order-client";

export const metadata: Metadata = {
  title: "Track your order | FitAndForm",
  description: "Track your FitAndForm order status without an account.",
  robots: { index: false, follow: false },
};

export default function TrackOrderPage() {
  return (
    <Suspense>
      <TrackOrderClient />
    </Suspense>
  );
}
