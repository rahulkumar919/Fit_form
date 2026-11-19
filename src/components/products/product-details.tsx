"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Heart, Ruler, Share2 } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/types";
import { ProductGallery } from "./product-gallery";
import { SizeSelector, ColorSelector, QuantitySelector } from "./selectors";
import { RatingStars } from "./rating-stars";
import { SalesBadge } from "./sales-badge";
import { BuyButtons, DeliveryPerks, MobileBuyBar, OfferNote, type StoreInfo } from "./purchase";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useStore } from "@/lib/store/store-provider";
import { discountPercent, formatINR, cn } from "@/lib/utils";

const sizeGuideRows = [
  { size: "S", chest: "38\"", waist: "32\"" },
  { size: "M", chest: "40\"", waist: "34\"" },
  { size: "L", chest: "42\"", waist: "36\"" },
  { size: "XL", chest: "44\"", waist: "38\"" },
  { size: "XXL", chest: "46\"", waist: "40\"" },
];

const SIZE_ANCHOR = "pdp-size";

export function ProductDetails({ product, info }: { product: Product; info: StoreInfo }) {
  const router = useRouter();
  const { addItem, toggleWishlist, isWishlisted, setCartOpen } = useStore();
  const [color, setColor] = React.useState(product.colors[0]?.name);
  const [size, setSize] = React.useState<string | undefined>();
  const [qty, setQty] = React.useState(1);
  const [guideOpen, setGuideOpen] = React.useState(false);
  const [sizeError, setSizeError] = React.useState(false);
  const [added, setAdded] = React.useState(false);

  const variant = product.variants.find((v) => v.color === color) ?? product.variants[0];
  const galleryImages = variant?.images.length ? variant.images : product.images;
  const variantSizes = React.useMemo(() => variant?.sizes ?? [], [variant]);
  const sizeObj = variantSizes.find((s) => s.size === size);
  const maxQty = sizeObj ? Math.max(1, Math.min(sizeObj.available, 10)) : 1;
  const inStock = variantSizes.some((s) => s.inStock);
  const wished = isWishlisted(product.id);
  const pct = product.compareAtPrice && product.compareAtPrice > product.price ? discountPercent(product.compareAtPrice, product.price) : 0;

  // One-size products (or a colour with a single size) need no choice.
  const onlySize = variantSizes.length === 1 && variantSizes[0].inStock ? variantSizes[0].size : undefined;
  const chosenSize = size ?? onlySize;

  const requireSize = (): boolean => {
    if (!chosenSize) {
      setSizeError(true);
      document.getElementById(SIZE_ANCHOR)?.scrollIntoView({ behavior: "smooth", block: "center" });
      toast.error("Please select a size");
      return false;
    }
    return true;
  };

  const add = (): boolean => {
    if (!requireSize()) return false;
    addItem({
      kind: "product",
      refId: product.id,
      name: product.name,
      slug: product.slug,
      image: galleryImages[0] ?? product.images[0],
      unitPrice: product.price,
      quantity: qty,
      size: chosenSize,
      color,
    });
    return true;
  };

  const addToBag = () => {
    if (!add()) return;
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2000);
    setCartOpen(true);
  };
  const buyNow = () => {
    if (add()) router.push("/checkout");
  };

  const share = async () => {
    const url = window.location.href.split("?")[0];
    try {
      if (navigator.share) await navigator.share({ title: product.name, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch { /* cancelled */ }
  };

  return (
    <div className="container-store pb-8 pt-0 sm:pt-6 md:pb-12 lg:pt-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)] lg:gap-12 xl:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ProductGallery images={galleryImages} alt={product.name} />
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          {/* title */}
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{product.categoryLabel}</span>
              {product.isNew && <Badge variant="new">New</Badge>}
              {product.isBestSeller && <Badge variant="warning">Bestseller</Badge>}
              {product.isLimitedOffer && <Badge variant="danger">Limited offer</Badge>}
            </div>
            <div className="mt-1.5 flex items-start gap-3">
              <h1 className="flex-1 text-xl font-semibold leading-snug tracking-tight sm:text-2xl lg:text-[1.7rem]">{product.name}</h1>
              <div className="flex shrink-0 gap-1">
                <button type="button" onClick={() => toggleWishlist(product.id)} aria-pressed={wished}
                  aria-label={wished ? "Remove from wishlist" : "Save to wishlist"}
                  className={cn("grid size-10 place-items-center rounded-full border border-border transition hover:bg-muted", wished && "border-sale text-sale")}>
                  <Heart className={cn("size-5", wished && "fill-sale")} />
                </button>
                <button type="button" onClick={share} aria-label="Share"
                  className="grid size-10 place-items-center rounded-full border border-border transition hover:bg-muted">
                  <Share2 className="size-[18px]" />
                </button>
              </div>
            </div>
            {/* Rating — use real data first, fall back to manualRating/manualReviewCount */}
            {(() => {
              const displayRating = product.rating > 0 ? product.rating : (product.manualRating ?? 0);
              const displayCount  = product.reviewCount > 0 ? product.reviewCount : (product.manualReviewCount ?? 0);
              return displayRating > 0 ? (
                <a href="#reviews" className="mt-2 flex w-fit items-center gap-2 hover:opacity-80">
                  <RatingStars rating={displayRating} count={displayCount} size="md" />
                </a>
              ) : null;
            })()}
            <SalesBadge slug={product.slug} manualSoldCount={product.manualSoldCount ?? 0} />
          </div>

          {/* price */}
          <div>
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <span className="text-2xl font-bold tabular-nums sm:text-3xl">{formatINR(product.price)}</span>
              {pct > 0 && (
                <>
                  <span className="text-base text-muted-foreground line-through">{formatINR(product.compareAtPrice!)}</span>
                  <span className="rounded-md bg-sale/10 px-1.5 py-0.5 text-sm font-semibold text-sale">{pct}% off</span>
                </>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">Inclusive of all taxes</p>
          </div>

          <OfferNote offer={info.offer} />

          {/* options */}
          <div className="flex flex-col gap-4 border-y border-border py-5">
            <ColorSelector colors={product.colors} value={color} onChange={(c) => { setColor(c); setSize(undefined); setSizeError(false); }} />
            {!onlySize && (
              <SizeSelector
                id={SIZE_ANCHOR}
                sizes={variantSizes}
                value={size}
                error={sizeError && !size}
                onChange={(s) => { setSize(s); setSizeError(false); setQty(1); }}
                onOpenGuide={() => setGuideOpen(true)}
              />
            )}
            {!inStock && <p className="text-sm font-medium text-destructive">This colour is currently out of stock.</p>}
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <span className="mb-1.5 block text-sm font-semibold">Quantity</span>
                <QuantitySelector value={qty} max={maxQty} onChange={setQty} />
              </div>
            </div>
          </div>

          {/* actions (phones also get the sticky bar below) */}
          <BuyButtons onAdd={addToBag} onBuy={buyNow} disabled={!inStock} added={added} />

          <DeliveryPerks info={info} price={product.price * qty} />

          {/* details */}
          <Accordion type="multiple" defaultValue={["details"]} className="-mt-1">
            <AccordionItem value="details">
              <AccordionTrigger>Product details</AccordionTrigger>
              <AccordionContent>
                <p className="leading-relaxed">{product.description}</p>
                {product.highlights.length > 0 && (
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                    {product.highlights.map((h) => <li key={h}>{h}</li>)}
                  </ul>
                )}
                <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                  {product.material && <><dt className="text-muted-foreground">Material</dt><dd>{product.material}</dd></>}
                  {product.care && <><dt className="text-muted-foreground">Care</dt><dd>{product.care}</dd></>}
                </dl>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="delivery">
              <AccordionTrigger>Delivery &amp; returns</AccordionTrigger>
              <AccordionContent>
                Orders are processed within 24 hours. Delivery typically takes 3–7 business days
                depending on your location.{info.codEnabled ? " Cash on Delivery is available." : ""} Returns are accepted
                within 7 days for unused items with tags intact.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="sourcing">
              <AccordionTrigger>Quality check</AccordionTrigger>
              <AccordionContent>
                Every item is checked before dispatch, and availability is confirmed before your order is accepted.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      <MobileBuyBar
        price={product.price * qty}
        compareAt={product.compareAtPrice ? product.compareAtPrice * qty : undefined}
        note={chosenSize ? `Size ${chosenSize}${color ? ` · ${color}` : ""}${qty > 1 ? ` · ×${qty}` : ""}` : "Select a size"}
        onAdd={addToBag}
        onBuy={buyNow}
        disabled={!inStock}
        added={added}
      />

      <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Ruler className="size-5" /> Size guide</DialogTitle>
            <DialogDescription>Body measurements in inches. For the best fit, measure a similar garment you own.</DialogDescription>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Size</TableHead><TableHead>Chest</TableHead><TableHead>Waist</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {sizeGuideRows.map((r) => (
                <TableRow key={r.size}>
                  <TableCell className="font-medium">{r.size}</TableCell>
                  <TableCell>{r.chest}</TableCell>
                  <TableCell>{r.waist}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </div>
  );
}
