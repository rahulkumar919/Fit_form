"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatINR } from "@/lib/utils";

interface ProductHit { id: string; slug: string; name: string; categoryLabel: string; price: number; image: string }
interface ComboHit { id: string; slug: string; name: string; itemCount: number; price: number; image: string }

export function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[12vh] max-w-2xl translate-y-0 p-0">
        <DialogTitle className="sr-only">Search products</DialogTitle>
        <DialogDescription className="sr-only">Search the MelaMart catalog</DialogDescription>
        {/* Content unmounts when the dialog closes, so the query resets automatically. */}
        <SearchPanel onNavigate={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

interface Results { term: string; products: ProductHit[]; combos: ComboHit[] }

function SearchPanel({ onNavigate }: { onNavigate: () => void }) {
  const [q, setQ] = React.useState("");
  const [results, setResults] = React.useState<Results>({ term: "", products: [], combos: [] });
  const term = q.trim();

  // Debounced server search; stale responses are ignored via the abort controller.
  React.useEffect(() => {
    if (!term) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: controller.signal });
        const json = await res.json();
        if (json.success) setResults({ term, products: json.data.products, combos: json.data.combos });
        else setResults({ term, products: [], combos: [] });
      } catch {
        if (!controller.signal.aborted) setResults((r) => ({ ...r, term }));
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term]);

  const loading = !!term && results.term !== term;
  const products = term ? results.products : [];
  const combos = term ? results.combos : [];

  return (
    <>
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="size-5 text-muted-foreground" />
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search for jeans, shirts, sneakers, combos…"
            className="h-9 border-0 px-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <ScrollArea className="max-h-[60vh]">
          <div className="p-2">
            {!term && (
              <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                Start typing to search the catalog.
              </div>
            )}
            {term && loading && products.length === 0 && combos.length === 0 && (
              <div className="px-3 py-8 text-center text-sm text-muted-foreground">Searching…</div>
            )}
            {term && !loading && products.length === 0 && combos.length === 0 && (
              <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                No results for “{q}”.
              </div>
            )}
            {products.length > 0 && (
              <div className="mb-2">
                <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Products</p>
                {products.map((p) => (
                  <Link
                    key={p.id}
                    href={`/product/${p.slug}`}
                    onClick={onNavigate}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-muted"
                  >
                    <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                      <Image src={p.image} alt={p.name} fill sizes="48px" className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.categoryLabel}</p>
                    </div>
                    <span className="text-sm font-semibold">{formatINR(p.price)}</span>
                  </Link>
                ))}
              </div>
            )}
            {combos.length > 0 && (
              <div>
                <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Combos</p>
                {combos.map((c) => (
                  <Link
                    key={c.id}
                    href={`/combo/${c.slug}`}
                    onClick={onNavigate}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-muted"
                  >
                    <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                      <Image src={c.image} alt={c.name} fill sizes="48px" className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.itemCount} products · combo</p>
                    </div>
                    <span className="text-sm font-semibold">{formatINR(c.price)}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
    </>
  );
}
