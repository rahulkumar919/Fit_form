"use client";

/**
 * /track-order
 *
 * Mode A — token from URL: ?token=UUID
 *   Auto-fetches the order on mount. No form needed.
 *
 * Mode B — manual lookup (no token):
 *   Shows a form: order number + email.
 *   Works for both guests and registered customers.
 */

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2, Clock, Loader2, Package, Search, Truck, XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatINR, cn } from "@/lib/utils";

/* ─── types ─── */

interface TrackedOrder {
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  items: { name: string; image: string; size: string; color: string; quantity: number; unitPrice: number; kind: string }[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  address: { fullName: string; city: string; state: string; pincode: string };
  advanceAmount?: number;
  remainingAmount?: number;
  codCollectedAt?: string | null;
  trackingId: string | null;
  carrier: string | null;
}

/* ─── status helpers ─── */

const STATUS_FLOW = [
  "new", "pending_sourcing", "meesho_ordered", "processing", "shipped", "delivered",
] as const;

const STATUS_LABEL: Record<string, string> = {
  new: "Order placed",
  pending_sourcing: "Confirmed",
  meesho_ordered: "Sourced",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

const STATUS_VARIANT: Record<string, "secondary" | "success" | "warning" | "danger" | "muted"> = {
  new: "warning",
  pending_sourcing: "warning",
  meesho_ordered: "secondary",
  processing: "secondary",
  shipped: "secondary",
  delivered: "success",
  cancelled: "danger",
  returned: "muted",
};

const PAYMENT_LABEL: Record<string, string> = {
  cod: "Cash on Delivery",
  razorpay: "Online (Razorpay)",
  cashfree: "Online (Cashfree)",
};

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

/* ─── order result card ─── */

function OrderCard({ order }: { order: TrackedOrder }) {
  const isCancelled = order.status === "cancelled" || order.status === "returned";
  const currentIdx = (STATUS_FLOW as readonly string[]).indexOf(order.status);
  const dateFmt = (() => {
    try {
      return new Date(order.createdAt).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
      });
    } catch { return order.createdAt; }
  })();

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">#{order.orderNumber}</span>
            <Badge variant={STATUS_VARIANT[order.status] ?? "muted"} className="capitalize">
              {STATUS_LABEL[order.status] ?? order.status}
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Placed {dateFmt} · {PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}
            {order.paymentStatus && ` · ${PAYMENT_STATUS_LABEL[order.paymentStatus] ?? order.paymentStatus}`}
          </p>
        </div>
        <p className="text-lg font-bold">{formatINR(order.total)}</p>
      </div>

      <Separator />

      {/* Items */}
      <div className="flex flex-col gap-3 p-5">
        {order.items.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-muted sm:h-16 sm:w-14">
              {item.image && (
                <Image src={item.image} alt={item.name} fill sizes="56px" className="object-cover" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-medium">{item.name}</p>
              {item.kind === "product" && (item.size || item.color) && (
                <p className="text-xs text-muted-foreground">
                  {[item.size, item.color].filter(Boolean).join(" · ")} · Qty {item.quantity}
                </p>
              )}
            </div>
            <span className="shrink-0 text-sm font-semibold">
              {formatINR(item.unitPrice * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      <Separator />

      {/* Price summary */}
      <div className="space-y-1.5 p-5 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span><span className="text-foreground">{formatINR(order.subtotal)}</span>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between text-emerald-600">
            <span>Discount</span><span>−{formatINR(order.discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-muted-foreground">
          <span>Shipping</span>
          <span className="text-foreground">{order.shipping === 0 ? "Free" : formatINR(order.shipping)}</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span>Total</span><span>{formatINR(order.total)}</span>
        </div>
      </div>

      {/* Partial COD breakdown */}
      {order.paymentMethod === "partial_cod" && (
        <>
          <Separator />
          <div className="space-y-1.5 rounded-xl bg-amber-50 p-4 text-sm border border-amber-200">
            <p className="font-semibold text-amber-900 mb-2">Partial COD — payment details</p>
            <div className="flex justify-between text-amber-800">
              <span>Advance paid online ✓</span>
              <span className="font-semibold text-emerald-700">{formatINR(order.advanceAmount ?? 0)}</span>
            </div>
            <div className="flex justify-between text-amber-800">
              <span>Remaining at delivery</span>
              <span className="font-semibold">{formatINR(order.remainingAmount ?? 0)}</span>
            </div>
            {order.codCollectedAt ? (
              <p className="text-xs text-emerald-700 mt-1">
                ✓ Remaining amount collected on {new Date(order.codCollectedAt).toLocaleDateString("en-IN")}
              </p>
            ) : (
              <p className="text-xs text-amber-700 mt-1">
                Please keep {formatINR(order.remainingAmount ?? 0)} ready for the delivery person.
              </p>
            )}
          </div>
        </>
      )}

      <Separator />

      {/* Delivery address */}
      <div className="p-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
          Delivering to
        </p>
        <p className="text-sm">
          {order.address.fullName}
          {order.address.city && `, ${order.address.city}`}
          {order.address.state && `, ${order.address.state}`}
          {order.address.pincode && ` – ${order.address.pincode}`}
        </p>
        {order.trackingId && (
          <p className="mt-2 text-xs text-muted-foreground">
            Tracking ID:{" "}
            <span className="font-mono font-medium text-foreground">{order.trackingId}</span>
            {order.carrier && ` via ${order.carrier}`}
          </p>
        )}
      </div>

      {/* Timeline */}
      <div className="border-t border-border bg-muted/30 p-5">
        {!isCancelled && currentIdx >= 0 ? (
          <div className="flex items-start justify-between gap-1 overflow-x-auto pb-1">
            {STATUS_FLOW.map((step, i) => {
              const done = i <= currentIdx;
              const icons = [Clock, Package, Truck, Package, Truck, CheckCircle2];
              const Icon = icons[i];
              return (
                <div key={step} className="flex flex-1 flex-col items-center gap-1 text-center min-w-[52px]">
                  <div className={cn(
                    "grid size-7 place-items-center rounded-full transition sm:size-8",
                    done ? "bg-foreground text-background" : "bg-muted text-muted-foreground",
                  )}>
                    <Icon className="size-3.5 sm:size-4" />
                  </div>
                  <span className={cn(
                    "text-[9px] leading-tight sm:text-[10px]",
                    done ? "font-medium text-foreground" : "text-muted-foreground",
                  )}>
                    {STATUS_LABEL[step]}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <XCircle className="size-4 text-destructive shrink-0" />
            {order.status === "cancelled"
              ? "This order was cancelled."
              : "This order was returned."}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── main component ─── */

export function TrackOrderClient() {
  const params = useSearchParams();
  const tokenFromUrl = params.get("token") ?? "";

  const [loadState, setLoadState] = React.useState<"idle" | "loading" | "done" | "error">(
    tokenFromUrl ? "loading" : "idle",
  );
  const [order, setOrder] = React.useState<TrackedOrder | null>(null);
  const [errorMsg, setErrorMsg] = React.useState("");

  // Manual form state
  const [orderNumber, setOrderNumber] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [formError, setFormError] = React.useState("");

  /* Auto-fetch when token is in URL */
  React.useEffect(() => {
    if (!tokenFromUrl) return;
    fetch(`/api/track-order?token=${encodeURIComponent(tokenFromUrl)}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success && j.data) {
          setOrder(j.data);
          setLoadState("done");
        } else {
          setErrorMsg(j.message ?? "Order not found.");
          setLoadState("error");
        }
      })
      .catch(() => {
        setErrorMsg("Could not load your order. Please try again.");
        setLoadState("error");
      });
  }, [tokenFromUrl]);

  /* Manual lookup */
  const handleManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const num = orderNumber.trim().toUpperCase();
    const em = email.trim().toLowerCase();
    if (!num) { setFormError("Enter your order number (e.g. FF-12345)"); return; }
    if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { setFormError("Enter a valid email address"); return; }

    setLoadState("loading");
    try {
      const res = await fetch("/api/track-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber: num, email: em }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success && json.data) {
        setOrder(json.data);
        setLoadState("done");
      } else {
        setErrorMsg(json.message ?? "No order found with those details. Check your order number and email.");
        setLoadState("error");
      }
    } catch {
      setErrorMsg("Network error. Please check your connection and try again.");
      setLoadState("error");
    }
  };

  /* Loading spinner */
  if (loadState === "loading") {
    return (
      <div className="container-store flex min-h-[50vh] flex-col items-center justify-center gap-4 py-16">
        <Loader2 className="size-10 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading your order…</p>
      </div>
    );
  }

  return (
    <div className="container-store py-10">
      <h1 className="font-serif text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
        Track your order
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        No account needed — enter your order details below.
      </p>

      {/* Manual lookup form — always visible (lets user look up a different order) */}
      {loadState !== "done" && (
        <form
          onSubmit={handleManual}
          className="mt-8 w-full max-w-md rounded-2xl border border-border bg-card p-5 sm:p-6"
          noValidate
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="track-num">Order number</Label>
              <Input
                id="track-num"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="FF-12345"
                autoCapitalize="characters"
                autoCorrect="off"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="track-email">Email address used at checkout</Label>
              <Input
                id="track-email"
                type="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            {(formError || (loadState === "error" && errorMsg)) && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {formError || errorMsg}
              </p>
            )}
            <Button type="submit" className="w-full">
              <Search className="size-4" />
              Find order
            </Button>
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Your order number looks like <strong>FF-12345</strong> and was included in your
            confirmation email.
          </p>
        </form>
      )}

      {/* Result */}
      {loadState === "done" && order && (
        <div className="mt-8 max-w-2xl">
          <OrderCard order={order} />
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => { setOrder(null); setLoadState("idle"); setOrderNumber(""); setEmail(""); }}
            >
              Track another order
            </Button>
            <Button asChild variant="outline">
              <Link href="/shop/all-products">Continue shopping</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
