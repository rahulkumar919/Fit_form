import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { PromoItem, PromoSection } from "@/lib/validations/homepage";
import { isAllowedImageUrl } from "@/lib/catalog-constants";
import { cn } from "@/lib/utils";

/* Aspect classes written out in full for Tailwind (mobile + @2xl desktop). */
const ASPECT: Record<string, string> = {
  "21/9": "aspect-[21/9]", "3/1": "aspect-[3/1]", "4/1": "aspect-[4/1]", "6/1": "aspect-[6/1]",
  "16/9": "aspect-video", "4/3": "aspect-[4/3]", "1/1": "aspect-square", "4/5": "aspect-[4/5]",
};
const ASPECT_DESKTOP: Record<string, string> = {
  "21/9": "@2xl:aspect-[21/9]", "3/1": "@2xl:aspect-[3/1]", "4/1": "@2xl:aspect-[4/1]", "6/1": "@2xl:aspect-[6/1]",
  "16/9": "@2xl:aspect-video", "4/3": "@2xl:aspect-[4/3]", "1/1": "@2xl:aspect-square", "4/5": "@2xl:aspect-[4/5]",
};
const DESKTOP_COLS: Record<number, string> = { 1: "@2xl:grid-cols-1", 2: "@2xl:grid-cols-2", 3: "@2xl:grid-cols-3", 4: "@2xl:grid-cols-4" };

/** One or more clickable promotional banners, placeable anywhere on the homepage. */
export function PromoBanners({ section: s, preview = false }: { section: PromoSection; preview?: boolean }) {
  const items = s.items.filter((i) => isAllowedImageUrl(i.image));
  if (items.length === 0) {
    return preview ? (
      <div className="container-store py-6">
        <div className="grid aspect-[4/1] place-items-center rounded-2xl border-2 border-dashed border-border text-sm text-muted-foreground">Promo banner: add an image</div>
      </div>
    ) : null;
  }
  const n = items.length;
  const mobile =
    s.mobileLayout === "scroll" && n > 1
      ? "no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 overflow-x-auto px-4 @2xl:mx-0 @2xl:grid @2xl:overflow-visible @2xl:px-0"
      : s.mobileLayout === "grid" && n > 1 ? "grid grid-cols-2" : "grid grid-cols-1";

  return (
    <section className={cn("@container py-4 md:py-6", !s.fullWidth && "container-store")}>
      {(s.eyebrow || s.title || s.subtitle) && (
        <div className={cn("mb-4", s.fullWidth && "container-store")}>
          {s.eyebrow && <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{s.eyebrow}</p>}
          {s.title && <h2 className="font-serif text-2xl font-bold tracking-tight @3xl:text-3xl">{s.title}</h2>}
          {s.subtitle && <p className="mt-1 text-sm text-muted-foreground">{s.subtitle}</p>}
        </div>
      )}
      <ul className={cn("gap-3 @2xl:gap-4", mobile, DESKTOP_COLS[n])}>
        {items.map((item, i) => (
          <li key={i} className={cn(s.mobileLayout === "scroll" && n > 1 && "shrink-0 basis-[85%] snap-start @2xl:basis-auto")}>
            <PromoTile item={item} section={s} sizes={`(min-width: 1280px) ${Math.round(1216 / n)}px, ${s.mobileLayout === "stack" ? 100 : 85}vw`} preview={preview} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function PromoTile({ item: b, section: s, sizes, preview }: { item: PromoItem; section: PromoSection; sizes: string; preview: boolean }) {
  const hasText = !!(b.title || b.subtitle || b.ctaLabel);
  const dark = b.theme === "dark";
  const mobileImg = b.mobileImage && isAllowedImageUrl(b.mobileImage) ? b.mobileImage : "";
  const body = (
    <div className={cn("group relative w-full overflow-hidden bg-muted", ASPECT[s.mobileAspect], ASPECT_DESKTOP[s.aspect], s.rounded && "rounded-2xl")}>
      <Image src={b.image} alt={hasText ? "" : b.alt || b.title || "Promotion"} fill sizes={sizes}
        className={cn("object-cover transition-transform duration-500 group-hover:scale-[1.02]", mobileImg && "hidden @md:block")} />
      {mobileImg && <Image src={mobileImg} alt={hasText ? "" : b.alt || "Promotion"} fill sizes="100vw" className="object-cover @md:hidden" />}
      {hasText && (
        <>
          {b.overlay && (
            <div aria-hidden className={cn("absolute inset-0", dark ? "bg-gradient-to-r from-white/85 via-white/30 to-transparent" : "bg-gradient-to-r from-black/65 via-black/20 to-transparent")} />
          )}
          <div className={cn("absolute inset-0 flex flex-col justify-center gap-1 p-4 @md:p-6 @2xl:p-8", dark ? "text-neutral-900" : "text-white")}>
            {b.title && <p className="max-w-[70%] font-serif text-lg font-bold leading-tight @md:text-2xl @3xl:text-3xl">{b.title}</p>}
            {b.subtitle && <p className={cn("max-w-[65%] text-xs @md:text-sm", dark ? "text-neutral-700" : "text-white/85")}>{b.subtitle}</p>}
            {b.ctaLabel && (
              <span className={cn("mt-2 inline-flex w-fit items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold @md:text-sm", dark ? "bg-neutral-900 text-white" : "bg-white text-neutral-900")}>
                {b.ctaLabel} <ArrowRight className="size-3.5" aria-hidden />
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
  if (!b.href || preview) return body;
  return (
    <Link href={b.href} aria-label={hasText ? undefined : b.alt || b.title || "Promotion"} className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {body}
    </Link>
  );
}
