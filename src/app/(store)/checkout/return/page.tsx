"use client";
/**
 * /checkout/return — Cashfree redirects here after payment.
 * Works for both authenticated customers and guests (no session required).
 * Wrapped in Suspense because useSearchParams() requires it.
 */
import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store/store-provider";

function CheckoutReturnContent() {
  const params = useSearchParams();
  const { clearCart } = useStore();
  const [state, setState] = React.useState<"loading" | "paid" | "failed">("loading");
  const [orderNumber, setOrderNumber] = React.useState("");
  const [guestTrackingToken, setGuestTrackingToken] = React.useState<string | null>(null);

  React.useEffect(() => {
    const orderId = params.get("orderId");
    const cfOrderId = params.get("cf_order_id") ?? params.get("order_id");
    (async () => {
      if (!orderId || !cfOrderId) {
        setState("failed");
        return;
      }
      try {
        const res = await fetch("/api/payments/cashfree", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, cfOrderId }),
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok && json.success && json.data?.paid) {
          clearCart();
          setOrderNumber(json.data.orderNumber ?? "");
          setGuestTrackingToken(json.data.guestTrackingToken ?? null);
          setState("paid");
        } else {
          setState("failed");
        }
      } catch {
        setState("failed");
      }
    })();
  }, [params, clearCart]);

  /* ── loading ── */
  if (state === "loading") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="size-10 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Confirming your payment…</p>
      </div>
    );
  }

  /* ── success ── */
  if (state === "paid") {
    const trackingHref = guestTrackingToken
      ? `/track-order?token=${guestTrackingToken}`
      : "/orders";

    return (
      <div className="container-store flex min-h-[60vh] flex-col items-center justify-center gap-5 py-20 text-center">
        <CheckCircle2 className="size-16 text-emerald-600" />
        <div>
          <h1 className="font-serif text-3xl font-bold">Order placed!</h1>
          {orderNumber && (
            <p className="mt-1 text-sm text-muted-foreground">Order #{orderNumber}</p>
          )}
          <p className="mt-2 text-sm text-muted-foreground">
            A confirmation email is on its way. We&apos;ll keep you updated as we prepare your
            order.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href={trackingHref}>Track order</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Continue shopping</Link>
          </Button>
        </div>
        {guestTrackingToken && (
          <p className="max-w-sm text-xs text-muted-foreground">
            Bookmark your tracking link or find it in your confirmation email — no account needed.
          </p>
        )}
      </div>
    );
  }

  /* ── failed ── */
  return (
    <div className="container-store flex min-h-[60vh] flex-col items-center justify-center gap-5 py-20 text-center">
      <XCircle className="size-16 text-destructive" />
      <div>
        <h1 className="font-serif text-3xl font-bold">Payment not confirmed</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Your order was saved but the payment was not completed. Try paying again from{" "}
          <Link href="/orders" className="font-medium underline underline-offset-2">
            My orders
          </Link>{" "}
          or choose Cash on Delivery.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild><Link href="/checkout">Try again</Link></Button>
        <Button asChild variant="outline"><Link href="/">Go home</Link></Button>
      </div>
    </div>
  );
}

export default function CheckoutReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
          <Loader2 className="size-10 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <CheckoutReturnContent />
    </Suspense>
  );
}
