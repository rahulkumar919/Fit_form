"use client";
import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/products/product-card";
import type { Product } from "@/types";
import type { ProductsSection } from "@/lib/validations/homepage";
import { cn } from "@/lib/utils";

/*
 * Card size = cards per row on desktop. Container queries keep the admin preview identical to the store.
 * Class names are spelled out so Tailwind can see them.
 */
const GRID_COLS: Record<number, string> = {
  2: "@3xl:grid-cols-2", 3: "@3xl:grid-cols-3", 4: "@3xl:grid-cols-4", 5: "@3xl:grid-cols-5", 6: "@3xl:grid-cols-6",
};
const RAIL_ITEM: Record<number, string> = {
  2: "@3xl:basis-[calc((100%-1rem)/2)]",
  3: "@3xl:basis-[calc((100%-2rem)/3)]",
  4: "@3xl:basis-[calc((100%-3rem)/4)]",
  5: "@3xl:basis-[calc((100%-4rem)/5)]",
  6: "@3xl:basis-[calc((100%-5rem)/6)]",
};
/* Phone card size: lg ≈ 1.5 per screen, md = 2, sm = 3. */
const MOBILE_RAIL = { lg: "basis-[66%] @md:basis-[45%]", md: "basis-[46%] @md:basis-[31%]", sm: "basis-[31%] @md:basis-[23%]" } as const;
const MOBILE_GRID = { lg: "grid-cols-1 @md:grid-cols-2", md: "grid-cols-2 @xl:grid-cols-3", sm: "grid-cols-3 @xl:grid-cols-4" } as const;

export function ProductSection({
  section: s, products, viewAllHref,
}: { section: Pick<ProductsSection, "eyebrow" | "title" | "subtitle" | "perRow" | "layout" | "showViewAll"> & Partial<Pick<ProductsSection, "mobileSize">>; products: Product[]; viewAllHref: string }) {
  const ref = React.useRef<HTMLUListElement>(null);
  if (products.length === 0) return null;
  const rail = s.layout === "rail";
  const m = s.mobileSize ?? "md";
  const scroll = (dir: -1 | 1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <section className="@container container-store py-8 md:py-12">
      <div className="mb-5 flex items-end justify-between gap-4 @3xl:mb-6">
        <div>
          {s.eyebrow && <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{s.eyebrow}</p>}
          {s.title && <h2 className="font-serif text-2xl font-bold tracking-tight @3xl:text-3xl">{s.title}</h2>}
          {s.subtitle && <p className="mt-1 text-sm text-muted-foreground">{s.subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {s.showViewAll && (
            <Link href={viewAllHref} className="text-sm font-medium underline-offset-4 hover:underline">
              View all <span aria-hidden>→</span>
            </Link>
          )}
          {rail && products.length > s.perRow && (
            <div className="hidden gap-1 @3xl:flex">
              <button type="button" onClick={() => scroll(-1)} aria-label="Scroll left" className="grid size-9 place-items-center rounded-full border border-border hover:bg-muted"><ChevronLeft className="size-4" /></button>
              <button type="button" onClick={() => scroll(1)} aria-label="Scroll right" className="grid size-9 place-items-center rounded-full border border-border hover:bg-muted"><ChevronRight className="size-4" /></button>
            </div>
          )}
        </div>
      </div>
      <ul
        ref={ref}
        className={cn(
          "gap-x-3 gap-y-6 @3xl:gap-x-4",
          rail
            ? "no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 overflow-x-auto px-4 pb-1 @3xl:mx-0 @3xl:px-0"
            : cn("grid", MOBILE_GRID[m], GRID_COLS[s.perRow]),
        )}
      >
        {products.map((p) => (
          <li key={p.id} className={cn(rail && cn("shrink-0 snap-start", MOBILE_RAIL[m], RAIL_ITEM[s.perRow]))}>
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}
