"use client";

/**
 * SalesBadge — shows "🔥 250+ sold" near the product title.
 * Fetches real sales count client-side and adds the admin's manualSoldCount on top.
 * Renders nothing if the combined total is 0.
 */

import * as React from "react";
import { Flame } from "lucide-react";

function roundDown(n: number): string {
  if (n >= 1000) return `${Math.floor(n / 100) * 100}+`;
  if (n >= 100)  return `${Math.floor(n / 10) * 10}+`;
  if (n >= 50)   return `${Math.floor(n / 10) * 10}+`;
  if (n >= 10)   return `${Math.floor(n / 5) * 5}+`;
  return `${n}`;
}

export function SalesBadge({ slug, manualSoldCount = 0 }: { slug: string; manualSoldCount?: number }) {
  const [realSales, setRealSales] = React.useState<number>(0);

  React.useEffect(() => {
    fetch(`/api/products/${encodeURIComponent(slug)}/sales`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success && typeof j.data?.total === "number") {
          setRealSales(j.data.total);
        }
      })
      .catch(() => null);
  }, [slug]);

  const total = realSales + (manualSoldCount ?? 0);
  if (total === 0) return null;

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-700">
      <Flame className="size-3 fill-orange-400 text-orange-500" aria-hidden />
      {roundDown(total)} sold
    </span>
  );
}
