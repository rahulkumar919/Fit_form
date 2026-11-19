import Link from "next/link";
import Image from "next/image";
import type { Category } from "@/types";
import type { CategoriesSection } from "@/lib/validations/homepage";
import { categoryHref, isAllowedImageUrl } from "@/lib/catalog-constants";
import { cn } from "@/lib/utils";

type Config = CategoriesSection;

/*
 * Layout uses container queries (@container / @3xl:) instead of viewport breakpoints,
 * so the admin preview renders the real mobile/desktop layout at any preview width.
 * Class names are written out in full so Tailwind can see them.
 */
const DESKTOP_COLS: Record<number, string> = {
  4: "@3xl:grid-cols-4",
  5: "@3xl:grid-cols-5",
  6: "@3xl:grid-cols-6",
  8: "@3xl:grid-cols-8",
  10: "@3xl:grid-cols-10",
};

/** Mobile columns map — written out so Tailwind can see all the classes. */
const PHONE_COLS: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
};
/** Legacy fallback (style-based). */
const MOBILE_GRID: Record<Config["style"], string> = {
  card: "grid-cols-2 @xl:grid-cols-3",
  tile: "grid-cols-3 @sm:grid-cols-4",
  circle: "grid-cols-4 @xl:grid-cols-5",
};

const SCROLL_ITEM: Record<Config["style"], string> = {
  card: "basis-[42%] @xl:basis-[30%]",
  tile: "basis-[28%] @xl:basis-[21%]",
  circle: "basis-[22%] @xl:basis-[17%]",
};

export function ShopByCategory({ categories, config }: { categories: Category[]; config: Config }) {
  if (!config.enabled || categories.length === 0) return null;
  const scroll = config.mobileLayout === "scroll";
  const mobileGrid = config.mobilePerRow ? (PHONE_COLS[config.mobilePerRow] ?? MOBILE_GRID[config.style]) : MOBILE_GRID[config.style];
  const sizes = `(min-width: 1024px) ${Math.ceil(100 / config.perRow)}vw, ${config.style === "card" ? 45 : 28}vw`;

  return (
    <section aria-labelledby="home-categories" className="@container container-store py-8 md:py-12">
      <div className="mb-5 flex items-end justify-between gap-4 @3xl:mb-7">
        <div>
          {config.eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{config.eyebrow}</p>
          )}
          <h2 id="home-categories" className="font-serif text-2xl font-bold tracking-tight @3xl:text-3xl">
            {config.title}
          </h2>
        </div>
        {config.showViewAll && (
          <Link href="/shop/all-products" className="shrink-0 text-sm font-medium text-foreground underline-offset-4 hover:underline">
            View all <span aria-hidden>→</span>
          </Link>
        )}
      </div>

      <ul
        className={cn(
          "gap-x-3 gap-y-5 @3xl:gap-x-5",
          scroll
            ? "no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 overflow-x-auto px-4 pb-1 @3xl:mx-0 @3xl:grid @3xl:overflow-visible @3xl:px-0"
            : cn("grid", mobileGrid),
          DESKTOP_COLS[config.perRow] ?? DESKTOP_COLS[8],
        )}
      >
        {categories.map((c) => (
          <li key={c.id} className={cn(scroll && cn("shrink-0 snap-start @3xl:basis-auto", SCROLL_ITEM[config.style]))}>
            <CategoryTile category={c} style={config.style} showCount={config.showCount} sizes={sizes} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function CategoryTile({
  category: c, style, showCount, sizes,
}: { category: Category; style: Config["style"]; showCount: boolean; sizes: string }) {
  const hasImage = !!c.image && isAllowedImageUrl(c.image);
  const count = showCount && c.productCount > 0 ? `${c.productCount} ${c.slug === "combos" ? "combos" : "items"}` : "";

  const media = (
    <>
      {hasImage ? (
        <Image
          src={c.image}
          alt=""
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        // Honest placeholder until the admin uploads an image.
        <span aria-hidden className="absolute inset-0 grid place-items-center font-serif text-2xl font-bold text-foreground/30">
          {c.name.slice(0, 1)}
        </span>
      )}
    </>
  );

  if (style === "card") {
    return (
      <Link href={categoryHref(c.slug)} className="group block overflow-hidden rounded-2xl bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <div className="relative aspect-[3/4]">
          {media}
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-3">
            <p className="text-sm font-semibold text-white">{c.name}</p>
            {count && <p className="text-xs text-white/75">{count}</p>}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={categoryHref(c.slug)} className="group block text-center focus-visible:outline-none">
      <div
        className={cn(
          "relative aspect-square overflow-hidden bg-[#f3f1ee] ring-1 ring-black/5 transition duration-300",
          "group-hover:-translate-y-0.5 group-hover:shadow-lg group-hover:shadow-black/10 group-focus-visible:ring-2 group-focus-visible:ring-ring",
          style === "circle" ? "rounded-full" : "rounded-2xl",
        )}
      >
        {media}
      </div>
      <p className="mt-2.5 line-clamp-2 text-[13px] font-medium leading-tight text-foreground @3xl:text-sm">{c.name}</p>
      {count && <p className="mt-0.5 text-[11px] text-muted-foreground">{count}</p>}
    </Link>
  );
}
