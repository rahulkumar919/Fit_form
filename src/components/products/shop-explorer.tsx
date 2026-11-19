"use client";

import * as React from "react";
import { SlidersHorizontal, X } from "lucide-react";
import type { Product, Category } from "@/types";
import { ProductCard } from "./product-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { formatINR, cn } from "@/lib/utils";

type SortKey = "featured" | "price-asc" | "price-desc" | "newest" | "rating";

const PAGE_SIZE = 9;

export function ShopExplorer({ products, category }: { products: Product[]; category: Category }) {
  const allSizes = React.useMemo(
    () => Array.from(new Set(products.flatMap((p) => p.sizes))),
    [products],
  );
  const allColors = React.useMemo(
    () => Array.from(new Map(products.flatMap((p) => p.colors).map((c) => [c.name, c])).values()),
    [products],
  );
  const priceBounds = React.useMemo(() => {
    if (products.length === 0) return [0, 0];
    const prices = products.map((p) => p.price);
    return [Math.min(...prices), Math.max(...prices)];
  }, [products]);

  const [sizes, setSizes] = React.useState<string[]>([]);
  const [colors, setColors] = React.useState<string[]>([]);
  const [priceMax, setPriceMax] = React.useState<number>(priceBounds[1]);
  const [inStockOnly, setInStockOnly] = React.useState(false);
  const [sort, setSort] = React.useState<SortKey>("featured");
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Pagination resets whenever the filter/sort combination changes (derived, no effect needed).
  const filterKey = JSON.stringify([sizes, colors, priceMax, inStockOnly, sort]);
  const [page, setPage] = React.useState({ key: filterKey, count: PAGE_SIZE });
  const visible = page.key === filterKey ? page.count : PAGE_SIZE;
  const showMore = () => setPage({ key: filterKey, count: visible + PAGE_SIZE });

  const toggle = (val: string, list: string[], set: (v: string[]) => void) => {
    set(list.includes(val) ? list.filter((x) => x !== val) : [...list, val]);
  };

  const filtered = React.useMemo(() => {
    let list = products.filter((p) => {
      if (priceMax < priceBounds[1] && p.price > priceMax) return false;
      if (colors.length && !p.colors.some((c) => colors.includes(c.name))) return false;
      if (sizes.length && !p.sizes.some((s) => sizes.includes(s))) return false;
      if (inStockOnly && !p.variants.some((v) => v.sizes.some((s) => s.inStock))) return false;
      return true;
    });
    list = [...list];
    switch (sort) {
      case "price-asc": list.sort((a, b) => a.price - b.price); break;
      case "price-desc": list.sort((a, b) => b.price - a.price); break;
      case "newest": list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)); break;
      case "rating": list.sort((a, b) => b.rating - a.rating); break;
      default: break;
    }
    return list;
  }, [products, sizes, colors, priceMax, inStockOnly, sort, priceBounds]);

  const shown = filtered.slice(0, visible);
  const activeFilters = sizes.length + colors.length + (inStockOnly ? 1 : 0) + (priceMax < priceBounds[1] ? 1 : 0);

  const clearAll = () => {
    setSizes([]); setColors([]); setPriceMax(priceBounds[1]); setInStockOnly(false);
  };

  // Plain render function (not a component) so inputs keep identity/focus across renders.
  const renderFilters = (inSheet = false) => (
    <div className={cn("flex flex-col gap-6", inSheet && "px-5 pb-6 pt-2")}>
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Size</h3>
        <div className="flex flex-wrap gap-2">
          {allSizes.map((s) => {
            const active = sizes.includes(s);
            return (
              <button
                key={s}
                onClick={() => toggle(s, sizes, setSizes)}
                className={cn(
                  "min-w-9 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition",
                  active ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/40",
                )}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Color</h3>
        <div className="flex flex-col gap-2.5">
          {allColors.map((c) => (
            <label key={c.name} className="flex cursor-pointer items-center gap-2.5">
              <Checkbox checked={colors.includes(c.name)} onCheckedChange={() => toggle(c.name, colors, setColors)} />
              <span className="size-4 rounded-full border border-border" style={{ backgroundColor: c.hex }} />
              <span className="text-sm text-foreground">{c.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Max price</h3>
        <Slider
          value={[priceMax]}
          min={priceBounds[0]}
          max={priceBounds[1]}
          step={50}
          onValueChange={(v) => setPriceMax(v[0])}
        />
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>{formatINR(priceBounds[0])}</span>
          <span className="font-semibold text-foreground">Up to {formatINR(priceMax)}</span>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Availability</h3>
        <label className="flex cursor-pointer items-center gap-2.5">
          <Checkbox checked={inStockOnly} onCheckedChange={(v) => setInStockOnly(!!v)} />
          <span className="text-sm text-foreground">In stock only</span>
        </label>
      </div>

      {activeFilters > 0 && (
        <Button variant="outline" size="sm" onClick={clearAll} className="w-full">
          <X className="size-4" /> Clear filters ({activeFilters})
        </Button>
      )}
    </div>
  );

  return (
    <div className="container-store py-8">
      {/* header */}
      <div className="mb-6">
        <nav className="text-xs text-muted-foreground">
          Home / <span className="text-foreground">{category.name}</span>
        </nav>
        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight md:text-4xl">{category.name}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{category.description}</p>
      </div>

      {/* toolbar */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="whitespace-nowrap text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{filtered.length}</span> products
        </p>
        <div className="flex items-center gap-2">
          {/* mobile filter trigger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="lg:hidden">
                <SlidersHorizontal className="size-4" /> Filters
                {activeFilters > 0 && <Badge variant="sale" className="ml-1">{activeFilters}</Badge>}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 overflow-y-auto p-0">
              <div className="px-5 pt-5">
                <SheetTitle className="text-base">Filters</SheetTitle>
                <SheetDescription className="sr-only">Filter products</SheetDescription>
              </div>
              {renderFilters(true)}
            </SheetContent>
          </Sheet>

          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="w-[150px] sm:w-[180px]" aria-label="Sort products"><SelectValue placeholder="Sort by" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="rating">Top rated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-8">
        {/* desktop sidebar */}
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-24">
            {renderFilters()}
          </div>
        </aside>

        {/* grid */}
        <div className="min-w-0 flex-1">
          {shown.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
              <p className="text-lg font-medium text-foreground">No products match your filters</p>
              <p className="text-sm text-muted-foreground">Try adjusting or clearing your filters.</p>
              <Button variant="outline" onClick={clearAll}>Clear filters</Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 xl:grid-cols-4">
                {shown.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              {visible < filtered.length && (
                <div className="mt-10 flex justify-center">
                  <Button variant="outline" onClick={showMore}>
                    Load more ({filtered.length - visible})
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
