"use client";

import * as React from "react";
import { Check, Ruler } from "lucide-react";
import { cn } from "@/lib/utils";

interface SizeOption {
  size: string;
  inStock: boolean;
  available?: number;
}

/** Low-stock threshold for the "Only N left" hint (real stock numbers only). */
const LOW_STOCK = 3;

export function SizeSelector({
  sizes,
  value,
  onChange,
  onOpenGuide,
  error = false,
  compact = false,
  label = "Size",
  id,
}: {
  sizes: SizeOption[];
  value?: string;
  onChange: (size: string) => void;
  onOpenGuide?: () => void;
  /** Highlight when the shopper tried to buy without choosing. */
  error?: boolean;
  compact?: boolean;
  label?: string;
  id?: string;
}) {
  const labelId = React.useId();
  const selected = sizes.find((s) => s.size === value);
  const low = selected?.inStock && selected.available !== undefined && selected.available <= LOW_STOCK ? selected.available : 0;
  return (
    <div id={id} className={cn("scroll-mt-28 rounded-xl transition", error && "animate-[ff-shake_0.35s_ease-in-out] bg-red-50 p-2 ring-1 ring-red-300")}>
      <div className={cn("flex items-center justify-between gap-3", compact ? "mb-1.5" : "mb-2")}>
        <span id={labelId} className={cn("font-semibold text-foreground", compact ? "text-xs" : "text-sm")}>
          {label}
          {value ? <span className="ml-1.5 font-normal text-muted-foreground">{value}</span> : error ? <span className="ml-1.5 font-normal text-red-700">Please select</span> : null}
        </span>
        {onOpenGuide && (
          <button type="button" onClick={onOpenGuide} className="inline-flex items-center gap-1 text-xs font-medium text-foreground underline-offset-4 hover:underline">
            <Ruler className="size-3.5" aria-hidden /> Size guide
          </button>
        )}
      </div>
      <div role="radiogroup" aria-labelledby={labelId} className={cn("flex flex-wrap", compact ? "gap-1.5" : "gap-2")}>
        {sizes.map((s) => {
          const active = value === s.size;
          return (
            <button
              key={s.size}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={s.inStock ? s.size : `${s.size}, out of stock`}
              disabled={!s.inStock}
              onClick={() => onChange(s.size)}
              className={cn(
                "relative rounded-lg border font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                compact ? "h-9 min-w-10 px-2.5 text-xs" : "h-11 min-w-12 px-3 text-sm",
                !s.inStock && "cursor-not-allowed border-dashed text-muted-foreground/60",
                active ? "border-foreground bg-foreground text-background" : s.inStock && "border-border bg-background hover:border-foreground",
              )}
            >
              {s.size}
              {!s.inStock && <span aria-hidden className="absolute inset-x-1.5 top-1/2 h-px -rotate-12 bg-muted-foreground/50" />}
            </button>
          );
        })}
      </div>
      {low > 0 && <p className="mt-1.5 text-xs font-medium text-amber-700">Only {low} left in {value}</p>}
    </div>
  );
}

export function ColorSelector({
  colors,
  value,
  onChange,
  compact = false,
}: {
  colors: { name: string; hex: string }[];
  value?: string;
  onChange: (name: string) => void;
  compact?: boolean;
}) {
  const labelId = React.useId();
  if (colors.length === 0) return null;
  return (
    <div>
      <div className={cn("flex items-center gap-1.5", compact ? "mb-1.5" : "mb-2")}>
        <span id={labelId} className={cn("font-semibold text-foreground", compact ? "text-xs" : "text-sm")}>Colour</span>
        {value && <span className={cn("text-muted-foreground", compact ? "text-xs" : "text-sm")}>{value}</span>}
      </div>
      <div role="radiogroup" aria-labelledby={labelId} className="flex flex-wrap gap-2">
        {colors.map((c) => {
          const active = value === c.name;
          return (
            <button
              key={c.name}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(c.name)}
              title={c.name}
              aria-label={c.name}
              className={cn(
                "relative grid place-items-center rounded-full ring-2 ring-offset-2 transition focus-visible:outline-none",
                compact ? "size-7" : "size-9",
                active ? "ring-foreground" : "ring-transparent hover:ring-foreground/30 focus-visible:ring-ring",
              )}
            >
              <span className={cn("rounded-full border border-black/10", compact ? "size-5" : "size-7")} style={{ backgroundColor: c.hex }} />
              {active && (
                <span className="absolute inset-0 grid place-items-center text-white mix-blend-difference">
                  <Check className={compact ? "size-3" : "size-4"} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function QuantitySelector({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="inline-flex h-11 items-center rounded-lg border border-border" role="group" aria-label="Quantity">
      <button type="button" onClick={() => onChange(Math.max(1, value - 1))} className="grid h-full w-10 place-items-center text-lg text-muted-foreground transition hover:text-foreground disabled:opacity-40" disabled={value <= 1} aria-label="Decrease quantity">−</button>
      <span className="w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">{value}</span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} className="grid h-full w-10 place-items-center text-lg text-muted-foreground transition hover:text-foreground disabled:opacity-40" disabled={value >= max} aria-label="Increase quantity">+</button>
    </div>
  );
}
