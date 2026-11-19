import Link from "next/link";
import { ComboCard } from "@/components/combos/combo-card";
import type { Combo } from "@/types";
import type { CombosSection } from "@/lib/validations/homepage";
import { cn } from "@/lib/utils";

type Config = Pick<CombosSection, "enabled" | "eyebrow" | "title" | "subtitle" | "count" | "perRow" | "mobileLayout"> &
  Partial<Pick<CombosSection, "mobileSize">>;

/* Container-query classes (so the admin preview matches); written out in full for Tailwind. */
const DESKTOP_COLS: Record<number, string> = {
  2: "@3xl:grid-cols-2", 3: "@3xl:grid-cols-3", 4: "@3xl:grid-cols-4", 5: "@3xl:grid-cols-5", 6: "@3xl:grid-cols-6",
};
/* Phone card size: lg ≈ 1.5 cards per screen, md = 2, sm = 3. */
const MOBILE_SCROLL = { lg: "basis-[66%] @md:basis-[45%]", md: "basis-[46%] @md:basis-[31%]", sm: "basis-[31%] @md:basis-[23%]" } as const;
const MOBILE_GRID = { lg: "grid-cols-1 @md:grid-cols-2", md: "grid-cols-2 @xl:grid-cols-3", sm: "grid-cols-3 @xl:grid-cols-4" } as const;
const VW = { lg: 66, md: 46, sm: 31 } as const;

export function TrendingCombos({ combos, config }: { combos: Combo[]; config: Config }) {
  const shown = combos.slice(0, config.count);
  if (!config.enabled || shown.length === 0) return null;
  const scroll = config.mobileLayout === "scroll";
  const m = config.mobileSize ?? "md";
  const sizes = `(min-width: 1024px) ${Math.ceil(100 / config.perRow)}vw, ${VW[m]}vw`;
  // Small cards (5–6 per row, or 3 per row on phones) drop secondary text so nothing gets cramped.
  const compact = config.perRow >= 5 ? "always" : m === "sm" ? "mobile" : "never";

  return (
    <section aria-labelledby="home-combos" className="@container bg-accent/60 py-10 md:py-14">
      <div className="container-store">
        <div className="mb-5 flex items-end justify-between gap-4 @3xl:mb-7">
          <div>
            {config.eyebrow && <p className="text-xs font-semibold uppercase tracking-widest text-sale">{config.eyebrow}</p>}
            <h2 id="home-combos" className="font-serif text-2xl font-bold tracking-tight @3xl:text-3xl">{config.title}</h2>
            {config.subtitle && <p className="mt-1 text-sm text-muted-foreground">{config.subtitle}</p>}
          </div>
          <Link href="/combos" className="shrink-0 text-sm font-medium text-foreground underline-offset-4 hover:underline">
            View all <span aria-hidden>→</span>
          </Link>
        </div>
        <ul
          className={cn(
            "gap-3 @3xl:gap-4",
            scroll
              ? "no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 overflow-x-auto px-4 pb-1 @3xl:mx-0 @3xl:grid @3xl:overflow-visible @3xl:px-0"
              : cn("grid", MOBILE_GRID[m]),
            DESKTOP_COLS[config.perRow] ?? DESKTOP_COLS[4],
          )}
        >
          {shown.map((combo) => (
            <li key={combo.id} className={cn(scroll && cn("shrink-0 snap-start @3xl:basis-auto", MOBILE_SCROLL[m]))}>
              <ComboCard combo={combo} sizes={sizes} compact={compact} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
