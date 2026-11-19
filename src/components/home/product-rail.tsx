"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/products/product-card";
import type { Product } from "@/types";

interface ProductRailProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  products: Product[];
  viewAllHref?: string;
}

export function ProductRail({ eyebrow, title, subtitle, products, viewAllHref }: ProductRailProps) {
  const ref = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    const el = ref.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  if (products.length === 0) return null;

  return (
    <section className="container-store py-14 md:py-16">
      <div className="mb-6 flex items-end justify-between">
        <div>
          {eyebrow && <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{eyebrow}</p>}
          <h2 className="font-serif text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {viewAllHref && (
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href={viewAllHref}>View all</Link>
            </Button>
          )}
          <div className="hidden gap-1 md:flex">
            <Button variant="outline" size="icon-sm" onClick={() => scroll("left")} aria-label="Scroll left"><ChevronLeft /></Button>
            <Button variant="outline" size="icon-sm" onClick={() => scroll("right")} aria-label="Scroll right"><ChevronRight /></Button>
          </div>
        </div>
      </div>
      <div ref={ref} className="no-scrollbar -mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-2">
        {products.map((p) => (
          <div key={p.id} className="w-[44vw] shrink-0 snap-start sm:w-[31vw] lg:w-[23vw] xl:w-[18rem]">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
