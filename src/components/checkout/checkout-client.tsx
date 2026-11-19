"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signIn } from "next-auth/react";
import { track } from "@/components/tracking/tracker";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle2, ChevronRight, Loader2, Lock, LogIn,
  ShoppingBag, SplitSquareHorizontal, User, Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { useStore } from "@/lib/store/store-provider";
import { checkoutSchema, type CheckoutForm, INDIAN_STATES } from "@/lib/validations/checkout";
import { formatINR, cn } from "@/lib/utils";
import type { Address } from "@/types";
import type { PartialCodSettings } from "@/services/settings-types";
import { getPartialCodBreakdown } from "@/lib/pricing/partial-cod";

/* ─── minimal window augmentation for SDK globals ─── */
declare global {
  interface Window {
    Cashfree?: new (opts: { mode: string }) => { checkout: (o: { paymentSessionId: string }) => void };
    Razorpay?: new (opts: RazorpayOptions) => { open: () => void; on: (event: string, cb: () => void) => void };
  }
}
interface RazorpayOptions {
  key: string; order_id: string; amount: number; currency: string;
  name: string; description: string; theme: { color: string };
  prefill?: { name?: string; email?: string; contact?: string };
  handler: (resp: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
  modal?: { ondismiss?: () => void };
}

/* ─── Cashfree SDK loader ─── */
function loadCashfree(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Cashfree) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

/* ─── types ─── */

/** "choose" = initial gate, "form" = fill details */
type CheckoutStep = "choose" | "form";

interface PlacedOrder {
  orderNumber: string;
  guestTrackingToken: string | null;
  advanceAmount?: number;
  remainingAmount?: number;
}

export function CheckoutClient({
  onlinePaymentEnabled,
  activeGateway = "cashfree",
  savedAddress = null,
  partialCodSettings = null,
}: {
  onlinePaymentEnabled: boolean;
  activeGateway?: "cashfree" | "razorpay" | "none";
  savedAddress?: Address | null;
  partialCodSettings?: PartialCodSettings | null;
}) {
  const { data: session, status: sessionStatus } = useSession();
  const { items, subtotal, discount, shipping, total, clearCart, appliedCoupon } = useStore();

  /* ─── routing state ─── */
  const [step, setStep] = React.useState<CheckoutStep>("choose");
  const [isGuest, setIsGuest] = React.useState(false);
  const [placed, setPlaced] = React.useState<PlacedOrder | null>(null);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [redirecting, setRedirecting] = React.useState(false);

  /* ─── Partial COD breakdown (computed from server config + live cart total) ─── */
  const partialCodBreakdown = React.useMemo(() => {
    if (!partialCodSettings) return null;
    return getPartialCodBreakdown(total, partialCodSettings, "razorpay");
  }, [total, partialCodSettings]);

  /* ─── If already logged in, skip the choice screen ─── */
  React.useEffect(() => {
    if (sessionStatus === "authenticated") {
      setIsGuest(false);
      setStep("form");
    }
  }, [sessionStatus]);

  /* ─── form ─── */
  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: savedAddress?.fullName ?? "",
      email: "",
      phone: savedAddress?.phone ?? "",
      line1: savedAddress?.line1 ?? "",
      line2: savedAddress?.line2 ?? "",
      city: savedAddress?.city ?? "",
      state: savedAddress?.state ?? "",
      pincode: savedAddress?.pincode ?? "",
      paymentMethod:
        activeGateway === "razorpay"
          ? "razorpay"
          : "cashfree",
    },
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = form;
  const payment = watch("paymentMethod");

  /* Prefill from session */
  React.useEffect(() => {
    if (session?.user?.name && !form.getValues("fullName")) setValue("fullName", session.user.name);
    if (session?.user?.email && !form.getValues("email")) setValue("email", session.user.email);
  }, [session, form, setValue]);

  /* Analytics: begin_checkout once */
  const tracked = React.useRef(false);
  React.useEffect(() => {
    if (!tracked.current && items.length > 0) {
      tracked.current = true;
      track("begin_checkout", { value: total });
    }
  }, [items.length, total]);

  /* ─── Cashfree ─── */
  const payCashfree = async (order: {
    id: string;
    orderNumber: string;
    guestTrackingToken: string | null;
    cashfree: { paymentSessionId: string; cfOrderId: string; sandbox: boolean };
  }) => {
    if (!(await loadCashfree())) {
      setServerError("Could not load the payment window. Check your connection and try again.");
      return;
    }
    const cashfree = new window.Cashfree!({
      mode: order.cashfree.sandbox ? "sandbox" : "production",
    });
    cashfree.checkout({ paymentSessionId: order.cashfree.paymentSessionId });
    setRedirecting(true);
  };

  /* ─── submit ─── */
  const onSubmit = async (data: CheckoutForm) => {
    setServerError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, items, couponCode: appliedCoupon?.code }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        setServerError(json.message ?? "We could not place your order. Please try again.");
        return;
      }

      const guestToken: string | null = json.data.guestTrackingToken ?? null;

      /* ── Razorpay ── */
      if (json.data.razorpay) {
        const rzpData = json.data as {
          id: string;
          orderNumber: string;
          guestTrackingToken: string | null;
          razorpay: { keyId: string; orderId: string; amount: number; currency: string };
        };
        const loaded = await new Promise<boolean>((resolve) => {
          if (window.Razorpay) return resolve(true);
          const s = document.createElement("script");
          s.src = "https://checkout.razorpay.com/v1/checkout.js";
          s.onload = () => resolve(true);
          s.onerror = () => resolve(false);
          document.body.appendChild(s);
        });
        if (!loaded) {
          setServerError("Could not load Razorpay. Check your connection and try again.");
          return;
        }
        await new Promise<void>((resolve) => {
          const rzp = new window.Razorpay!({
            key: rzpData.razorpay.keyId,
            order_id: rzpData.razorpay.orderId,
            amount: rzpData.razorpay.amount,
            currency: rzpData.razorpay.currency,
            name: "FitAndForm",
            description: json.data.advanceAmount
              ? `Advance for Order ${rzpData.orderNumber} · Pay ${formatINR(json.data.advanceAmount as number)} now`
              : `Order ${rzpData.orderNumber}`,
            theme: { color: "#0f172a" },
            prefill: {
              name: data.fullName,
              email: data.email,
              contact: data.phone,
            },
            handler: async (resp: {
              razorpay_order_id: string;
              razorpay_payment_id: string;
              razorpay_signature: string;
            }) => {
              const vRes = await fetch("/api/payments/razorpay/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId: rzpData.id, ...resp }),
              });
              const vJson = await vRes.json().catch(() => ({}));
              if (vRes.ok && vJson.success) {
                clearCart();
                setPlaced({
                  orderNumber: vJson.data?.orderNumber ?? rzpData.orderNumber,
                  guestTrackingToken: vJson.data?.guestTrackingToken ?? rzpData.guestTrackingToken,
                  advanceAmount: (json.data.advanceAmount as number | undefined) ?? undefined,
                  remainingAmount: (json.data.remainingAmount as number | undefined) ?? undefined,
                });
                window.scrollTo({ top: 0 });
              } else {
                setServerError(
                  `Payment received but could not be confirmed (${vJson.message ?? "verification failed"}). Contact us with order #${rzpData.orderNumber}.`,
                );
              }
              resolve();
            },
            modal: {
              ondismiss: () => {
                setServerError(
                  `Payment was not completed. Your order #${rzpData.orderNumber} is saved — pay again from ${isGuest ? "the tracking link in your email" : "My Orders"}.`,
                );
                resolve();
              },
            },
          });
          rzp.on("payment.failed", () => {
            setServerError("Payment failed. No money was taken. Please try again.");
          });
          rzp.open();
        });
        return;
      }

      /* ── Cashfree ── */
      if (json.data.cashfree) {
        await payCashfree(json.data);
        return;
      }

      /* ── COD or Partial COD confirmed ── */
      clearCart();
      setPlaced({ orderNumber: json.data.orderNumber, guestTrackingToken: guestToken });
      window.scrollTo({ top: 0 });
    } catch {
      setServerError("Network error. Please check your connection and try again.");
    }
  };

  /* ─── screens ─── */

  if (redirecting) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="size-10 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Redirecting to payment…</p>
      </div>
    );
  }

  if (placed) {
    const trackingHref = placed.guestTrackingToken
      ? `/track-order?token=${placed.guestTrackingToken}`
      : "/orders";
    return (
      <div className="container-store flex min-h-[60vh] items-center justify-center py-16">
        <div className="w-full max-w-md px-4 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100">
            <CheckCircle2 className="size-9 text-emerald-600" />
          </div>
          <h1 className="mt-5 font-serif text-2xl font-bold tracking-tight sm:text-3xl">
            Order confirmed!
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Thank you! Your order{" "}
            <span className="font-semibold text-foreground">#{placed.orderNumber}</span> has been
            placed. A confirmation email is on its way.
          </p>
          {placed.advanceAmount && placed.remainingAmount ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-left">
              <p className="font-semibold text-amber-900 mb-1.5">Partial COD — payment summary</p>
              <div className="space-y-1 text-amber-800">
                <div className="flex justify-between">
                  <span>Advance paid online</span>
                  <span className="font-semibold">{formatINR(placed.advanceAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Remaining at delivery</span>
                  <span className="font-semibold">{formatINR(placed.remainingAmount)}</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-amber-700">
                Please keep {formatINR(placed.remainingAmount)} ready for the delivery person.
              </p>
            </div>
          ) : null}
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link href={trackingHref}>Track order</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/shop/all-products">Continue shopping</Link>
            </Button>
          </div>
          {placed.guestTrackingToken && (
            <p className="mt-4 text-xs text-muted-foreground">
              Bookmark your tracking link or find it in your confirmation email — no account needed.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-store flex min-h-[50vh] flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="grid size-16 place-items-center rounded-full bg-muted">
          <ShoppingBag className="size-7 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium text-foreground">Your bag is empty</p>
          <p className="text-sm text-muted-foreground">Add items before checking out.</p>
        </div>
        <Button asChild>
          <Link href="/shop/all-products">Browse products</Link>
        </Button>
      </div>
    );
  }

  /* ─── CHOICE SCREEN ─── */
  if (step === "choose") {
    return (
      <div className="container-store py-10">
        <h1 className="font-serif text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
          Checkout
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">How would you like to continue?</p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Options */}
          <div className="flex flex-col gap-4">
            {/* Guest option */}
            <button
              type="button"
              onClick={() => { setIsGuest(true); setStep("form"); }}
              className="flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-5 text-left transition hover:border-foreground/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="grid size-11 shrink-0 place-items-center rounded-full bg-muted">
                <User className="size-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">Continue as Guest</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  No account needed — just enter your details and place your order.
                </p>
              </div>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
            </button>

            {/* Login option */}
            <button
              type="button"
              onClick={() => signIn(undefined, { callbackUrl: "/checkout" })}
              className="flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-5 text-left transition hover:border-foreground/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="grid size-11 shrink-0 place-items-center rounded-full bg-sky-100">
                <LogIn className="size-5 text-sky-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">Login / Create Account</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Sign in to save your address, track orders and get personalised offers.
                </p>
              </div>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
            </button>

            <p className="text-center text-xs text-muted-foreground">
              Guest orders can be tracked using the link in your confirmation email.
            </p>
          </div>

          {/* Mini order summary */}
          <OrderSummary
            items={items}
            subtotal={subtotal}
            discount={discount}
            shipping={shipping}
            total={total}
          />
        </div>
      </div>
    );
  }

  /* ─── FORM SCREEN ─── */
  return (
    <div className="container-store py-8 sm:py-10">
      <div className="mb-6 flex items-center gap-2">
        {sessionStatus !== "authenticated" && (
          <button
            type="button"
            onClick={() => setStep("choose")}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back
          </button>
        )}
        <h1 className="font-serif text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
          Checkout
        </h1>
        {isGuest && (
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            Guest
          </span>
        )}
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid gap-6 lg:grid-cols-[1fr_380px] lg:gap-8"
        noValidate
      >
        {/* ── form fields ── */}
        <div className="flex flex-col gap-6">

          {/* Section 1: Contact */}
          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold sm:text-lg">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-foreground text-xs text-background">
                1
              </span>
              Contact details
            </h2>

            {/* Mobile: single column. sm+: two columns */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fullName">Full name *</Label>
                <Input
                  id="fullName"
                  autoComplete="name"
                  {...register("fullName")}
                  placeholder="Riyaan Sharma"
                  aria-invalid={!!errors.fullName}
                />
                {errors.fullName && (
                  <p className="text-xs text-destructive" role="alert">{errors.fullName.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="phone">Mobile number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  {...register("phone")}
                  placeholder="9876543210"
                  aria-invalid={!!errors.phone}
                />
                {errors.phone && (
                  <p className="text-xs text-destructive" role="alert">{errors.phone.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="email">Email address *</Label>
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  {...register("email")}
                  placeholder="you@example.com"
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <p className="text-xs text-destructive" role="alert">{errors.email.message}</p>
                )}
                {isGuest && (
                  <p className="text-xs text-muted-foreground">
                    Your order confirmation and tracking link will be sent here.
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Section 2: Delivery address */}
          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold sm:text-lg">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-foreground text-xs text-background">
                2
              </span>
              Delivery address
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="line1">House / Flat / Building *</Label>
                <Input
                  id="line1"
                  autoComplete="address-line1"
                  {...register("line1")}
                  placeholder="Flat 4B, Sunrise Apartments"
                  aria-invalid={!!errors.line1}
                />
                {errors.line1 && (
                  <p className="text-xs text-destructive" role="alert">{errors.line1.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="line2">
                  Area / Landmark{" "}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="line2"
                  autoComplete="address-line2"
                  {...register("line2")}
                  placeholder="Near City Mall, Koramangala"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pincode">PIN code *</Label>
                <Input
                  id="pincode"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={6}
                  {...register("pincode")}
                  placeholder="560034"
                  aria-invalid={!!errors.pincode}
                />
                {errors.pincode && (
                  <p className="text-xs text-destructive" role="alert">{errors.pincode.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  autoComplete="address-level2"
                  {...register("city")}
                  placeholder="Bengaluru"
                  aria-invalid={!!errors.city}
                />
                {errors.city && (
                  <p className="text-xs text-destructive" role="alert">{errors.city.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="state">State *</Label>
                <Select
                  defaultValue={savedAddress?.state || undefined}
                  onValueChange={(v) => setValue("state", v, { shouldValidate: true })}
                >
                  <SelectTrigger id="state" aria-invalid={!!errors.state}>
                    <SelectValue placeholder="Select your state" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDIAN_STATES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.state && (
                  <p className="text-xs text-destructive" role="alert">{errors.state.message}</p>
                )}
              </div>

              {/* Save address — only shown for logged-in users */}
              {!isGuest && (
                <div className="flex items-center gap-2 sm:col-span-2">
                  <Checkbox
                    id="saveAddress"
                    checked={watch("saveAddress") ?? false}
                    onCheckedChange={(v) => setValue("saveAddress", !!v)}
                  />
                  <Label htmlFor="saveAddress" className="text-sm font-normal text-muted-foreground cursor-pointer">
                    Save this address to my account
                  </Label>
                </div>
              )}
            </div>
          </section>

          {/* Section 3: Payment */}
          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold sm:text-lg">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-foreground text-xs text-background">
                3
              </span>
              Payment method
            </h2>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Online gateway */}
              {activeGateway !== "none" && (
                <label
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition",
                    !onlinePaymentEnabled && "cursor-not-allowed opacity-50",
                    payment === "cashfree" || payment === "razorpay"
                      ? "border-foreground bg-muted/40"
                      : "border-border hover:border-foreground/40",
                  )}
                >
                  <input
                    type="radio"
                    value={activeGateway === "razorpay" ? "razorpay" : "cashfree"}
                    disabled={!onlinePaymentEnabled}
                    {...register("paymentMethod")}
                    className="sr-only"
                  />
                  <Wallet className="size-5 shrink-0 text-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">
                      {activeGateway === "razorpay" ? "Pay Online (Razorpay)" : "Pay Online (Cashfree)"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {onlinePaymentEnabled
                        ? "UPI · Cards · Net banking · Wallets"
                        : "Coming soon"}
                    </p>
                  </div>
                  {(payment === "cashfree" || payment === "razorpay") && (
                    <CheckCircle2 className="ml-auto size-5 shrink-0 text-foreground" />
                  )}
                </label>
              )}
            </div>

            {/* ── Partial COD option ── */}
            {partialCodBreakdown && (
              <label
                className={cn(
                  "mt-1 flex cursor-pointer flex-col gap-2 rounded-xl border p-4 transition",
                  payment === "partial_cod"
                    ? "border-amber-500 bg-amber-50/60"
                    : "border-border hover:border-amber-400/60",
                )}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    value="partial_cod"
                    {...register("paymentMethod")}
                    className="sr-only"
                  />
                  <SplitSquareHorizontal className="size-5 shrink-0 text-amber-700" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">Partial COD</p>
                    <p className="text-xs text-muted-foreground">
                      Pay a small advance online, rest at delivery
                    </p>
                  </div>
                  {payment === "partial_cod" && (
                    <CheckCircle2 className="ml-auto size-5 shrink-0 text-amber-600" />
                  )}
                </div>

                {/* Breakdown — always visible so customer knows upfront */}
                <div className="ml-8 space-y-1 rounded-lg border border-amber-200 bg-white px-3 py-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order total</span>
                    <span className="font-medium">{formatINR(total)}</span>
                  </div>
                  <div className="flex justify-between text-amber-800">
                    <span>Pay now (advance)</span>
                    <span className="font-semibold">{formatINR(partialCodBreakdown.advance)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Pay at delivery</span>
                    <span className="font-medium">{formatINR(partialCodBreakdown.remaining)}</span>
                  </div>
                </div>
              </label>
            )}

            {onlinePaymentEnabled && activeGateway !== "none" && (
              <p className="mt-2 text-xs text-muted-foreground">
                Powered by {activeGateway === "razorpay" ? "Razorpay" : "Cashfree"} — 100%
                secure, RBI-authorised.
              </p>
            )}
          </section>
        </div>

        {/* ── order summary (sticky on desktop, stacked on mobile) ── */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-base font-semibold">Order summary</h2>
            <div className="mt-4 flex flex-col gap-3">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-muted sm:h-16 sm:w-14">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.kind === "combo"
                        ? `${item.comboItems?.length ?? 0} items`
                        : `${item.size} · ${item.color}`}{" "}
                      · Qty {item.quantity}
                    </p>
                    <p className="text-sm font-semibold">
                      {formatINR(item.unitPrice * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="text-foreground">{formatINR(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span>−{formatINR(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span className="text-foreground">
                  {shipping === 0 ? "Free" : formatINR(shipping)}
                </span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>{formatINR(total)}</span>
              </div>
            </div>

            {serverError && (
              <div
                role="alert"
                className="mt-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700"
              >
                {serverError}
              </div>
            )}

            <Button
              type="submit"
              className="mt-5 w-full"
              size="lg"
              disabled={isSubmitting || redirecting}
            >
              <Lock className="size-4" />
              {isSubmitting || redirecting
                ? "Processing…"
                : payment === "partial_cod" && partialCodBreakdown
                  ? `Pay advance · ${formatINR(partialCodBreakdown.advance)}`
                  : `Place order · ${formatINR(total)}`}
            </Button>

            <p className="mt-3 text-center text-xs text-muted-foreground">
              Prices are verified server-side when you place the order.
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}

/* ─── mini order summary (used on choice screen) ─── */
function OrderSummary({
  items,
  subtotal,
  discount,
  shipping,
  total,
}: {
  items: ReturnType<typeof useStore>["items"];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
}) {
  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold">Your bag</h2>
        <div className="mt-4 flex flex-col gap-3">
          {items.map((item) => (
            <div key={item.id} className="flex gap-3">
              <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                <Image src={item.image} alt={item.name} fill sizes="48px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">Qty {item.quantity}</p>
                <p className="text-sm font-semibold">{formatINR(item.unitPrice * item.quantity)}</p>
              </div>
            </div>
          ))}
        </div>
        <Separator className="my-4" />
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span><span className="text-foreground">{formatINR(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Discount</span><span>−{formatINR(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-muted-foreground">
            <span>Shipping</span>
            <span className="text-foreground">{shipping === 0 ? "Free" : formatINR(shipping)}</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between text-base font-semibold">
            <span>Total</span><span>{formatINR(total)}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
