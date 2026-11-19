import Image from "next/image";
import Link from "next/link";
import type { Combo } from "@/types";
import { cn, formatINR } from "@/lib/utils";

/**
 * Compact combo card: one link, outfit photo, the pieces as small thumbnails,
 * and the price with savings. Sized to sit 4-up on desktop.
 */
export function ComboCard({
  combo, sizes = "(min-width: 1024px) 23vw, (min-width: 640px) 31vw, 48vw", compact = "never",
}: {
  combo: Combo;
  sizes?: string;
  /** Drop secondary text on small cards: always, only on phones, or never. */
  compact?: "always" | "mobile" | "never";
}) {
  // "hide" = class that hides an element in compact mode (container query for phone-only compact).
  const hide = compact === "always" ? "hidden" : compact === "mobile" ? "hidden @3xl:block" : "";
  const hideFlex = compact === "always" ? "hidden" : compact === "mobile" ? "hidden @3xl:flex" : "flex";
  const savings = combo.combinedPrice - combo.comboPrice;
  const pct = combo.combinedPrice > 0 ? Math.round((savings / combo.combinedPrice) * 100) : 0;
  const pieces = combo.items.slice(0, 3);

  return (
    <Link
      href={`/combo/${combo.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-border/70 bg-card transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        {combo.images[0] && (
          <Image
            src={combo.images[0]}
            alt=""
            fill
            sizes={sizes}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        )}
        <div className="absolute inset-x-2 top-2 flex items-start justify-between gap-1">
          {savings > 0 ? (
            <span className="rounded-full bg-sale px-2 py-0.5 text-[10px] font-semibold text-sale-foreground sm:text-[11px]">Save {pct}%</span>
          ) : <span />}
          {combo.isBestSeller && (
            <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-amber-800 backdrop-blur sm:text-[11px]">Bestseller</span>
          )}
        </div>
        {pieces.length > 0 && (
          <div className={cn("absolute bottom-2 left-2 items-center rounded-full bg-white/90 p-0.5 pr-2 shadow-sm backdrop-blur", hideFlex)}>
            <div className="flex -space-x-2">
              {pieces.map((it) => (
                <span key={it.productId} className="relative size-6 overflow-hidden rounded-full border-2 border-white bg-muted sm:size-7">
                  {it.image && <Image src={it.image} alt="" fill sizes="28px" className="object-cover" />}
                </span>
              ))}
            </div>
            <span className="ml-1.5 text-[10px] font-medium text-foreground sm:text-[11px]">
              {combo.items.length} pieces
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-2.5 sm:p-3">
        <h3 className="line-clamp-1 text-[13px] font-semibold text-foreground sm:text-sm">{combo.name}</h3>
        {combo.tagline && <p className={cn("mt-0.5 line-clamp-1 text-[11px] text-muted-foreground sm:text-xs", hide)}>{combo.tagline}</p>}
        <div className="mt-auto flex flex-wrap items-baseline gap-x-1.5 pt-2">
          <span className="text-sm font-bold text-foreground sm:text-[15px]">{formatINR(combo.comboPrice)}</span>
          {savings > 0 && (
            <>
              <span className="text-[11px] text-muted-foreground line-through sm:text-xs">{formatINR(combo.combinedPrice)}</span>
              <span className={cn("text-[11px] font-medium text-emerald-700 sm:text-xs", hide)}>Save {formatINR(savings)}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
