import { Banknote, Gift, Headphones, RefreshCcw, ShieldCheck, Star, Tag, Truck, type LucideIcon } from "lucide-react";
import type { FeatureItem } from "@/lib/validations/homepage";
import { cn } from "@/lib/utils";

export const FEATURE_ICON_MAP: Record<FeatureItem["icon"], LucideIcon> = {
  truck: Truck, cod: Banknote, returns: RefreshCcw, secure: ShieldCheck, tag: Tag, star: Star, support: Headphones, gift: Gift,
};

/** Short reasons to buy (delivery, COD, returns…). Text is admin-written; {freeShipping} is filled from settings. */
export function FeaturesStrip({ items, style = "plain", className }: { items: FeatureItem[]; style?: "plain" | "cards"; className?: string }) {
  if (items.length === 0) return null;
  return (
    <section className={cn("@container container-store py-6 md:py-8", className)}>
      <ul className={cn("grid grid-cols-2 gap-3 @3xl:gap-4", items.length >= 4 ? "@3xl:grid-cols-4" : items.length === 3 ? "@3xl:grid-cols-3" : "@3xl:grid-cols-2", items.length > 4 && "@5xl:grid-cols-6")}>
        {items.map((f, i) => {
          const Icon = FEATURE_ICON_MAP[f.icon] ?? Star;
          return (
            <li key={i} className={cn("flex items-center gap-3", style === "cards" && "rounded-2xl border border-border bg-card p-3 @3xl:p-4")}>
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted @3xl:size-11"><Icon className="size-5 text-foreground" aria-hidden /></span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold leading-tight text-foreground">{f.title}</span>
                {f.text && <span className="block text-xs text-muted-foreground">{f.text}</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
