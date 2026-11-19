"use client";

import * as React from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/products/product-card";
import { ComboCard } from "@/components/combos/combo-card";
import { useStore } from "@/lib/store/store-provider";
import type { Combo, Product } from "@/types";

export default function WishlistPage() {
  const { wishlist } = useStore();
  // Resolve saved ids against the live catalog; ids that no longer exist simply drop out.
  // Results are tagged with the id-set they were fetched for, so "loading" is derived.
  const key = wishlist.join(",");
  const [res, setRes] = React.useState<{ key: string; products: Product[]; combos: Combo[] }>({ key: "", products: [], combos: [] });
  React.useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    fetch(`/api/catalog/lookup?ids=${encodeURIComponent(key)}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setRes({ key, products: json.data.products, combos: json.data.combos });
        else setRes({ key, products: [], combos: [] });
      })
      .catch(() => {
        if (!controller.signal.aborted) setRes((r) => ({ ...r, key }));
      });
    return () => controller.abort();
  }, [key]);

  const loading = !!key && res.key !== key;
  const products = key ? res.products : [];
  const combos = key ? res.combos : [];

  const shown = products.length + combos.length;

  return (
    <div className="container-store py-10">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold tracking-tight md:text-4xl">Your wishlist</h1>
        <p className="mt-1 text-sm text-muted-foreground">{loading ? "Loading…" : `${shown} saved item(s)`}</p>
      </div>

      {wishlist.length === 0 || (!loading && shown === 0) ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <div className="grid size-16 place-items-center rounded-full bg-muted"><Heart className="size-7 text-muted-foreground" /></div>
          <div>
            <p className="font-medium text-foreground">No saved items yet</p>
            <p className="text-sm text-muted-foreground">Tap the heart on any product to save it for later.</p>
          </div>
          <Button asChild><Link href="/shop/all-products">Discover products</Link></Button>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {products.length > 0 && (
            <div>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Products</h2>
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
                {products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            </div>
          )}
          {combos.length > 0 && (
            <div>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Combos</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                {combos.map((c) => <ComboCard key={c.id} combo={c} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
