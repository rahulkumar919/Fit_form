"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Copy, Heart, Layers, Share2 } from "lucide-react";
import { toast } from "sonner";
import type { Combo, Product } from "@/types";
import { ProductGallery } from "@/components/products/product-gallery";
import { ColorSelector, SizeSelector } from "@/components/products/selectors";
import { BuyButtons, DeliveryPerks, MobileBuyBar, OfferNote, type StoreInfo } from "@/components/products/purchase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useStore } from "@/lib/store/store-provider";
import { useOrigin } from "@/lib/use-origin";
import { formatINR, cn } from "@/lib/utils";

interface ItemState { included: boolean; color: string; size?: string }

const rowId = (id: string) => `combo-item-${id}`;

function sizesFor(p: Product, color: string) {
  return (p.variants.find((v) => v.color === color) ?? p.variants[0])?.sizes ?? [];
}

/** A size is implied when the chosen colour has exactly one in-stock size (e.g. "One Size"). */
function effectiveSize(p: Product, st: ItemState): string | undefined {
  if (st.size) return st.size;
  const s = sizesFor(p, st.color);
  return s.length === 1 && s[0].inStock ? s[0].size : undefined;
}

export function ComboBuilder({ combo, products, info }: { combo: Combo; products: Product[]; info: StoreInfo }) {
  const router = useRouter();
  const { addItem, toggleWishlist, isWishlisted, setCartOpen } = useStore();
  const [state, setState] = React.useState<Record<string, ItemState>>(() =>
    Object.fromEntries(products.map((p) => [p.id, { included: true, color: p.colors[0]?.name ?? "" }])),
  );
  const [errors, setErrors] = React.useState<Set<string>>(new Set());
  const [separate, setSeparate] = React.useState(false);
  const [added, setAdded] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const origin = useOrigin();
  const shareUrl = origin ? `${origin}/combo/${combo.slug}` : "";

  const patch = (id: string, p: Partial<ItemState>) => {
    setState((s) => ({ ...s, [id]: { ...s[id], ...p } }));
    if (p.size) setErrors((e) => { const n = new Set(e); n.delete(id); return n; });
  };

  const savings = combo.combinedPrice - combo.comboPrice;
  const pct = combo.combinedPrice > 0 ? Math.round((savings / combo.combinedPrice) * 100) : 0;
  const wished = isWishlisted(combo.id);
  const picked = products.filter((p) => effectiveSize(p, state[p.id])).length;
  const selected = products.filter((p) => state[p.id].included);
  const selectedSum = selected.reduce((sum, p) => sum + p.price, 0);
  const allInStock = products.every((p) => sizesFor(p, state[p.id].color).some((s) => s.inStock));

  /** Flag every item without a size and bring the first one into view. */
  const requireSizes = (list: Product[]): boolean => {
    const missing = list.filter((p) => !effectiveSize(p, state[p.id]));
    if (missing.length === 0) return true;
    setErrors(new Set(missing.map((p) => p.id)));
    document.getElementById(rowId(missing[0].id))?.scrollIntoView({ behavior: "smooth", block: "center" });
    toast.error(missing.length === 1 ? `Select a size for ${missing[0].name}` : `Select sizes for ${missing.length} items`);
    return false;
  };

  const addCombo = (): boolean => {
    if (!requireSizes(products)) return false;
    addItem({
      kind: "combo",
      refId: combo.id,
      name: combo.name,
      slug: combo.slug,
      image: combo.images[0],
      unitPrice: combo.comboPrice,
      quantity: 1,
      selections: products.map((p) => ({ productId: p.id, size: effectiveSize(p, state[p.id])!, color: state[p.id].color })),
      comboItems: products.map((p) => ({ name: p.name, size: effectiveSize(p, state[p.id])!, color: state[p.id].color })),
    });
    return true;
  };

  const confirmAdded = () => {
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2000);
    setCartOpen(true);
  };

  const onAdd = () => { if (addCombo()) confirmAdded(); };
  const onBuy = () => { if (addCombo()) router.push("/checkout"); };

  const addSelected = () => {
    if (selected.length === 0) return toast.error("Tick at least one item");
    if (!requireSizes(selected)) return;
    for (const p of selected) {
      addItem({
        kind: "product", refId: p.id, name: p.name, slug: p.slug, image: p.images[0], unitPrice: p.price, quantity: 1,
        size: effectiveSize(p, state[p.id]), color: state[p.id].color,
      });
    }
    confirmAdded();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${shareUrl}?ref=${combo.reelRef ?? "share"}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy link");
    }
  };

  return (
    <div className="container-store pb-10 pt-0 sm:pt-6 lg:pt-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)] lg:gap-12 xl:gap-16">
        {/* gallery */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ProductGallery images={combo.images} alt={combo.name} />
          <div className="mt-3 hidden items-center gap-2 lg:flex">
            <Button variant="ghost" size="sm" asChild>
              <a href={`https://wa.me/?text=${encodeURIComponent(`${combo.name} on MelaMart ${shareUrl}`)}`} target="_blank" rel="noopener noreferrer">
                <Share2 /> Share on WhatsApp
              </a>
            </Button>
            <Button variant="ghost" size="sm" onClick={copyLink}>{copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy link"}</Button>
          </div>
        </div>

        {/* buy panel */}
        <div className="flex min-w-0 flex-col gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary"><Layers className="size-3" /> Combo · {products.length} pieces</Badge>
              {combo.isBestSeller && <Badge variant="warning">Bestseller</Badge>}
            </div>
            <div className="mt-1.5 flex items-start gap-3">
              <div className="flex-1">
                <h1 className="text-xl font-semibold leading-snug tracking-tight sm:text-2xl lg:text-[1.7rem]">{combo.name}</h1>
                {combo.tagline && <p className="mt-0.5 text-sm text-muted-foreground">{combo.tagline}</p>}
              </div>
              <button type="button" onClick={() => toggleWishlist(combo.id, "combo")} aria-pressed={wished}
                aria-label={wished ? "Remove from wishlist" : "Save to wishlist"}
                className={cn("grid size-10 shrink-0 place-items-center rounded-full border border-border transition hover:bg-muted", wished && "border-sale text-sale")}>
                <Heart className={cn("size-5", wished && "fill-sale")} />
              </button>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <span className="text-2xl font-bold tabular-nums sm:text-3xl">{formatINR(combo.comboPrice)}</span>
              {savings > 0 && (
                <>
                  <span className="text-base text-muted-foreground line-through">{formatINR(combo.combinedPrice)}</span>
                  <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-sm font-semibold text-emerald-700">Save {formatINR(savings)} ({pct}%)</span>
                </>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">Complete look price · inclusive of all taxes</p>
          </div>

          <OfferNote offer={info.offer} />

          {/* items + sizes */}
          <section aria-labelledby="combo-sizes" className="rounded-2xl border border-border">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <h2 id="combo-sizes" className="text-sm font-semibold">{separate ? "Pick the items you want" : "Choose your sizes"}</h2>
              <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums", picked === products.length ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground")}>
                {picked === products.length ? <><Check className="-mt-0.5 mr-0.5 inline size-3" />All set</> : `${picked}/${products.length} sizes`}
              </span>
            </div>
            <ul className="divide-y divide-border">
              {products.map((p) => {
                const st = state[p.id];
                const err = errors.has(p.id);
                const sizes = sizesFor(p, st.color);
                const single = sizes.length === 1 && sizes[0].inStock;
                return (
                  <li key={p.id} id={rowId(p.id)} className={cn("scroll-mt-28 flex gap-3 p-3 sm:p-4", separate && !st.included && "opacity-55")}>
                    {separate && (
                      <Checkbox checked={st.included} onCheckedChange={(v) => patch(p.id, { included: !!v })} aria-label={`Include ${p.name}`} className="mt-1" />
                    )}
                    <Link href={`/product/${p.slug}`} className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-muted sm:h-24 sm:w-20" aria-label={`View ${p.name}`}>
                      {p.images[0] && <Image src={p.images[0]} alt="" fill sizes="80px" className="object-cover" />}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{p.categoryLabel}</p>
                          <Link href={`/product/${p.slug}`} className="line-clamp-1 text-sm font-semibold hover:underline">{p.name}</Link>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{formatINR(p.price)}</span>
                      </div>
                      <div className="mt-2 flex flex-col gap-2.5">
                        {p.colors.length > 1 && (
                          <ColorSelector compact colors={p.colors} value={st.color} onChange={(c) => patch(p.id, { color: c, size: undefined })} />
                        )}
                        {single ? (
                          <p className="text-xs text-muted-foreground">Size: <span className="font-medium text-foreground">{sizes[0].size}</span></p>
                        ) : (
                          <SizeSelector compact sizes={sizes} value={st.size} error={err && !st.size} onChange={(s) => patch(p.id, { size: s })} />
                        )}
                        {!sizes.some((s) => s.inStock) && <p className="text-xs font-medium text-destructive">Out of stock in {st.color}</p>}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          {separate ? (
            <div className="grid gap-2.5">
              <Button type="button" variant="accent" size="lg" className="h-12 font-semibold" onClick={addSelected} disabled={selected.length === 0}>
                Add {selected.length} item{selected.length === 1 ? "" : "s"} to bag · {formatINR(selectedSum)}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Individual prices. The full combo is {formatINR(combo.comboPrice)} {savings > 0 ? `(you'd save ${formatINR(savings)})` : ""}.{" "}
                <button type="button" onClick={() => setSeparate(false)} className="font-medium text-foreground underline underline-offset-2">Back to combo</button>
              </p>
            </div>
          ) : (
            <div className="grid gap-2">
              <BuyButtons onAdd={onAdd} onBuy={onBuy} disabled={!allInStock} added={added} addLabel="Add combo" buyLabel="Buy combo" />
              <button type="button" onClick={() => setSeparate(true)} className="mx-auto inline-flex items-center gap-1 py-1 text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
                Want only some pieces? Buy them separately <ChevronDown className="size-3.5" aria-hidden />
              </button>
            </div>
          )}

          <DeliveryPerks info={info} price={combo.comboPrice} />

          {combo.description && (
            <Accordion type="single" collapsible defaultValue="about">
              <AccordionItem value="about">
                <AccordionTrigger>About this look</AccordionTrigger>
                <AccordionContent><p className="leading-relaxed">{combo.description}</p></AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </div>
      </div>

      {!separate && (
        <MobileBuyBar
          price={combo.comboPrice}
          compareAt={combo.combinedPrice}
          note={picked === products.length ? "All sizes selected" : `Sizes selected ${picked}/${products.length}`}
          onAdd={onAdd}
          onBuy={onBuy}
          disabled={!allInStock}
          added={added}
          buyLabel="Buy combo"
        />
      )}
    </div>
  );
}
