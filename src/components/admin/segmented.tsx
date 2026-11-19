"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/** Pill-style single choice used across the homepage builder. */
export function Segmented<T extends string | number>({
  label, value, options, onChange, format = String,
}: { label: string; value: T; options: readonly T[]; onChange: (v: T) => void; format?: (v: T) => string }) {
  const id = React.useId();
  return (
    <div>
      <p id={id} className="mb-1.5 text-sm font-medium text-sky-950">{label}</p>
      <div role="radiogroup" aria-labelledby={id} className="inline-flex flex-wrap gap-1 rounded-xl border border-sky-900/10 bg-white/50 p-1">
        {options.map((o) => (
          <button
            key={String(o)}
            type="button"
            role="radio"
            aria-checked={value === o}
            onClick={() => onChange(o)}
            className={cn(
              "min-w-10 rounded-lg px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
              value === o ? "bg-sky-900 text-white shadow-sm" : "text-sky-950/75 hover:bg-white",
            )}
          >
            {format(o)}
          </button>
        ))}
      </div>
    </div>
  );
}
