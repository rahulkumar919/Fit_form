"use client";

import * as React from "react";
import { Banknote, Check, ShieldCheck, ShoppingBag, Tag, Truck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatINR } from "@/lib/utils";

/** Live store facts passed from the server (settings + active welcome coupon). Nothing hard-coded. */
export interface StoreInfo {
  freeShippingThreshold: number;
  flatShipping: number;
  codEnabled: boolean;
  offer: { code: string; description: string } | null;
}

export function OfferNote({ offer }: { offer: StoreInfo["offer"] }) {
  if (!offer) return null;
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-dashed border-emerald-300 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900">
      <Tag className="size-4 shrink-0" aria-hidden />
      <span>
        {offer.description || "Special offer"}: use code <strong className="font-mono tracking-wide">{offer.code}</strong> at checkout
      </span>
    </div>
  );
}

export function DeliveryPerks({ info, price }: { info: StoreInfo; price: number }) {
  const free = info.freeShippingThreshold <= 0 || price >= info.freeShippingThreshold;
  const perks = [
    {
      icon: Truck,
      title: free ? "Free delivery" : `Free delivery over ${formatINR(info.freeShippingThreshold)}`,
      sub: free ? "on this order" : `${formatINR(info.flatShipping)} below that`,
    },
    ...(info.codEnabled ? [{ icon: Banknote, title: "Cash on Delivery", sub: "pay when it arrives" }] : []),
    { icon: ShieldCheck, title: "Secure checkout", sub: "UPI, cards & more" },
  ];
  return (
    <ul className="grid grid-cols-3 gap-2">
      {perks.map((p) => (
        <li key={p.title} className="flex flex-col items-center gap-1 rounded-xl bg-muted/60 px-2 py-3 text-center">
          <p.icon className="size-5 text-foreground" aria-hidden />
          <span className="text-[11px] font-semibold leading-tight text-foreground sm:text-xs">{p.title}</span>
          <span className="text-[10px] leading-tight text-muted-foreground sm:text-[11px]">{p.sub}</span>
        </li>
      ))}
    </ul>
  );
}

/** The two main actions. "Added" briefly confirms success on the bag button. */
export function BuyButtons({
  onAdd, onBuy, disabled, added, addLabel = "Add to bag", buyLabel = "Buy now", className,
}: {
  onAdd: () => void;
  onBuy: () => void;
  disabled?: boolean;
  added?: boolean;
  addLabel?: string;
  buyLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-2.5", className)}>
      <Button type="button" variant="outline" size="lg" onClick={onAdd} disabled={disabled}
        className={cn("h-12 border-2 border-foreground px-3 font-semibold", added && "border-emerald-600 text-emerald-700")}>
        {added ? <Check /> : <ShoppingBag />} {added ? "Added" : addLabel}
      </Button>
      <Button type="button" variant="accent" size="lg" onClick={onBuy} disabled={disabled} className="h-12 px-3 font-semibold">
        <Zap /> {buyLabel}
      </Button>
    </div>
  );
}

/** Phone-only bar that keeps price + actions on screen while scrolling. */
export function MobileBuyBar({
  price, compareAt, note, onAdd, onBuy, disabled, added, addLabel = "Add", buyLabel = "Buy now",
}: {
  price: number;
  compareAt?: number;
  note?: string;
  onAdd: () => void;
  onBuy: () => void;
  disabled?: boolean;
  added?: boolean;
  addLabel?: string;
  buyLabel?: string;
}) {
  // Reserve room at the bottom of the page so the bar never covers the footer.
  React.useEffect(() => {
    document.body.classList.add("has-buy-bar");
    return () => document.body.classList.remove("has-buy-bar");
  }, []);
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.15)] backdrop-blur-lg md:hidden">
      <div className="flex items-center gap-2 px-4 py-2.5">
        <div className="min-w-0 flex-1 leading-tight">
          <p className="text-base font-bold tabular-nums">
            {formatINR(price)}
            {compareAt && compareAt > price && <span className="ml-1.5 text-xs font-normal text-muted-foreground line-through">{formatINR(compareAt)}</span>}
          </p>
          {note && <p className="truncate text-[11px] text-muted-foreground">{note}</p>}
        </div>
        <Button type="button" variant="outline" onClick={onAdd} disabled={disabled}
          className={cn("h-11 border-2 border-foreground px-3 font-semibold", added && "border-emerald-600 text-emerald-700")}
          aria-label={added ? "Added to bag" : addLabel}>
          {added ? <Check /> : <ShoppingBag />} <span className="max-[360px]:sr-only">{added ? "Added" : addLabel}</span>
        </Button>
        <Button type="button" variant="accent" onClick={onBuy} disabled={disabled} className="h-11 px-4 font-semibold">
          {buyLabel}
        </Button>
      </div>
    </div>
  );
}
