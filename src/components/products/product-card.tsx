"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Plus, ShoppingBag } from "lucide-react";
import type { Product } from "@/types";
import { Price } from "./price";
import { RatingStars } from "./rating-stars";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store/store-provider";
import { toast } from "sonner";
import { discountPercent, cn } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const { addItem, toggleWishlist, isWishlisted } = useStore();
  const wished = isWishlisted(product.id);
  const hasDiscount = !!product.compareAtPrice && product.compareAtPrice > product.price;

  // first colour + size that is actually available
  const pick = (() => {
    for (const v of product.variants) {
      const s = v.sizes.find((z) => z.inStock && z.available > 0);
      if (s) return { color: v.color, size: s.size };
    }
    return null;
  })();

  const quickAdd = () => {
    if (!pick) return;
    addItem({
      kind: "product",
      refId: product.id,
      name: product.name,
      slug: product.slug,
      image: product.images[0],
      unitPrice: product.price,
      quantity: 1,
      size: pick.size,
      color: pick.color,
    });
    toast.success("Added to bag", { description: `${product.name} (${pick.size}, ${pick.color})` });
  };

  // Show at most two labels so badges never cover the photo.
  const labels = [
    product.isNew && { text: "New", cls: "bg-foreground text-background" },
    product.isLimitedOffer && { text: "Limited", cls: "bg-red-100 text-red-700" },
    product.isBestSeller && { text: "Bestseller", cls: "bg-amber-100 text-amber-800" },
  ].filter(Boolean).slice(0, hasDiscount ? 1 : 2) as { text: string; cls: string }[];

  return (
    <div className="group relative flex flex-col">
      <div className="relative overflow-hidden rounded-xl bg-muted">
        <Link href={`/product/${product.slug}`} className="block aspect-[4/5]" aria-label={product.name}>
          {product.images[0] && (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 22vw"
              className={cn(
                "object-cover transition-all duration-500 group-hover:scale-[1.03]",
                product.images[1] && "md:group-hover:opacity-0",
              )}
            />
          )}
          {product.images[1] && (
            <Image
              src={product.images[1]}
              alt=""
              fill
              sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 22vw"
              className="hidden object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100 md:block"
            />
          )}
        </Link>

        <div className="pointer-events-none absolute left-2 top-2 flex flex-col items-start gap-1">
          {hasDiscount && (
            <span className="rounded-full bg-sale px-2 py-0.5 text-[10px] font-semibold text-sale-foreground sm:text-[11px]">
              -{discountPercent(product.compareAtPrice!, product.price)}%
            </span>
          )}
          {labels.map((l) => (
            <span key={l.text} className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold sm:text-[11px]", l.cls)}>{l.text}</span>
          ))}
        </div>

        <button
          onClick={() => toggleWishlist(product.id)}
          aria-label={wished ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          aria-pressed={wished}
          className={cn(
            "absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-background/85 shadow-sm backdrop-blur transition hover:bg-background",
            wished && "text-sale",
          )}
        >
          <Heart className={cn("size-4", wished && "fill-sale")} />
        </button>

        {/* mobile: compact add button (no hover on touch screens) */}
        <button
          onClick={quickAdd}
          disabled={!pick}
          aria-label={pick ? `Quick add ${product.name}` : `${product.name} is out of stock`}
          className="absolute bottom-2 right-2 grid size-8 place-items-center rounded-full bg-foreground text-background shadow-md disabled:opacity-40 md:hidden"
        >
          <Plus className="size-4" />
        </button>

        {/* desktop: full-width quick add on hover */}
        <div className="absolute inset-x-2 bottom-2 hidden translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 md:block">
          <Button onClick={quickAdd} disabled={!pick} className="w-full" size="sm">
            <ShoppingBag /> {pick ? "Quick add" : "Out of stock"}
          </Button>
        </div>
      </div>

      <div className="mt-2 flex flex-col gap-0.5 sm:mt-3 sm:gap-1">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-[11px]">{product.categoryLabel}</span>
        <Link href={`/product/${product.slug}`} className="line-clamp-1 text-[13px] font-medium text-foreground hover:underline sm:text-sm">
          {product.name}
        </Link>
        {product.reviewCount > 0 && <RatingStars rating={product.rating} count={product.reviewCount} />}
        <Price price={product.price} compareAtPrice={product.compareAtPrice} size="sm" className="flex-wrap gap-x-1.5 gap-y-0" />
      </div>
    </div>
  );
}
