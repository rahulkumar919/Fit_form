"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUp, Plus, Search, Trash2, X } from "lucide-react";
import type { Category, Product } from "@/types";
import type { AdminBannerRow } from "@/services/homepage";
import {
  BANNER_HEIGHTS, CARD_PER_ROW, CATEGORY_COUNTS, CATEGORY_MOBILE_COLS, CATEGORY_PER_ROW, CATEGORY_STYLES, COMBO_COUNTS, COMBO_PER_ROW,
  COMBO_SOURCES, FEATURE_ICONS, MOBILE_BANNER_ASPECTS, MOBILE_CARD_SIZES, GALLERY_COUNTS, PRODUCT_COUNTS, PRODUCT_SORTS, PRODUCT_SOURCES, PROMO_ASPECTS,
  REEL_COUNTS, REVIEW_COUNTS,
  type CategoriesSection, type CombosSection, type FeatureItem, type FeaturesSection, type GallerySection,
  type HeroSection, type HomeSection, type NewsletterSection, type ProductsSection, type PromoItem, type PromoSection,
  type ReelsSection, type ReviewsSection,
} from "@/lib/validations/homepage";
import { BannerManager } from "@/components/admin/banner-manager";
import { BANNER_SIZE_HINT } from "@/components/home/hero-carousel";
import { FEATURE_ICON_MAP } from "@/components/home/features-strip";
import { Segmented } from "@/components/admin/segmented";
import { SingleImageField } from "@/components/admin/single-image-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { isAllowedImageUrl } from "@/lib/catalog-constants";
import { cn, formatINR } from "@/lib/utils";

export interface EditorContext {
  categories: Category[];
  products: Product[];
  banners: AdminBannerRow[];
  destinations: { label: string; href: string }[];
  socialCount: { reels: number; gallery: number };
  reviewCount: number;
}

/* ───────────────────────── small fields ───────────────────────── */

export function TextField({
  label, value, onChange, max, placeholder, hint, list,
}: { label: string; value: string; onChange: (v: string) => void; max: number; placeholder?: string; hint?: string; list?: string }) {
  const id = React.useId();
  return (
    <div>
      <Label htmlFor={id} className="mb-1.5 block text-xs">{label}</Label>
      <Input id={id} value={value} maxLength={max} placeholder={placeholder} list={list} onChange={(e) => onChange(e.target.value)} className="h-9" />
      {hint && <p className="mt-1 text-[11px] text-sky-950/60">{hint}</p>}
    </div>
  );
}

export function ToggleField({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  const id = React.useId();
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <Label htmlFor={id} className="text-sm">{label}</Label>
        {hint && <p className="text-[11px] text-sky-950/60">{hint}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function SelectField<T extends string>({
  label, value, options, onChange,
}: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  const id = React.useId();
  return (
    <div>
      <Label htmlFor={id} className="mb-1.5 block text-xs">{label}</Label>
      <Select value={value} onValueChange={(v) => onChange(v as T)}>
        <SelectTrigger id={id} className="h-9"><SelectValue /></SelectTrigger>
        <SelectContent className="max-h-72">
          {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function Heading<T extends { eyebrow: string; title: string; subtitle?: string }>({ s, set, subtitle = true }: { s: T; set: (p: Partial<T>) => void; subtitle?: boolean }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <TextField label="Small label" value={s.eyebrow} max={30} onChange={(v) => set({ eyebrow: v } as Partial<T>)} placeholder="Optional" />
      <TextField label="Title" value={s.title} max={60} onChange={(v) => set({ title: v } as Partial<T>)} />
      {subtitle && "subtitle" in s && (
        <div className="sm:col-span-2">
          <TextField label="Subtext" value={s.subtitle ?? ""} max={120} onChange={(v) => set({ subtitle: v } as Partial<T>)} placeholder="Optional" />
        </div>
      )}
    </div>
  );
}

const CARD_SIZE_LABEL: Record<number, string> = { 2: "XL", 3: "Large", 4: "Medium", 5: "Small", 6: "XS" };
const MOBILE_SIZE_LABEL = { lg: "Big · 1½", md: "Medium · 2", sm: "Small · 3" } as const;
const ASPECT_LABEL: Record<string, string> = {
  "21/9": "Cinema 21:9", "3/1": "Wide 3:1", "4/1": "Strip 4:1", "6/1": "Slim 6:1",
  "16/9": "Video 16:9", "4/3": "Classic 4:3", "1/1": "Square", "4/5": "Portrait 4:5",
};
const ASPECT_CLASS: Record<string, string> = {
  "21/9": "aspect-[21/9]", "3/1": "aspect-[3/1]", "4/1": "aspect-[4/1]", "6/1": "aspect-[6/1]",
  "16/9": "aspect-video", "4/3": "aspect-[4/3]", "1/1": "aspect-square", "4/5": "aspect-[4/5]",
};
const ASPECT_PX: Record<string, string> = {
  "21/9": "2100 × 900", "3/1": "1920 × 640", "4/1": "1920 × 480", "6/1": "1920 × 320",
  "16/9": "1600 × 900", "4/3": "1200 × 900", "1/1": "1080 × 1080", "4/5": "1080 × 1350",
};
const SOURCE_LABEL: Record<(typeof PRODUCT_SOURCES)[number], string> = {
  bestsellers: "Best sellers", new: "New arrivals", limited: "Limited-time offers", trending: "Trending",
  sale: "On sale (biggest discounts)", category: "From a category", manual: "Hand-picked products", all: "All products",
};
const SORT_LABEL: Record<(typeof PRODUCT_SORTS)[number], string> = {
  default: "Default", newest: "Newest first", "price-asc": "Price: low to high", "price-desc": "Price: high to low", discount: "Biggest discount",
};
const FEATURE_LABEL: Record<FeatureItem["icon"], string> = {
  truck: "Delivery", cod: "Cash", returns: "Returns", secure: "Secure", tag: "Offer", star: "Quality", support: "Support", gift: "Gift",
};

/* ───────────────────────── editors ───────────────────────── */

export function SectionEditor({ section, onChange, ctx }: { section: HomeSection; onChange: (s: HomeSection) => void; ctx: EditorContext }) {
  switch (section.type) {
    case "hero": return <HeroEditor s={section} onChange={onChange} ctx={ctx} />;
    case "promo": return <PromoEditor s={section} onChange={onChange} ctx={ctx} />;
    case "categories": return <CategoriesEditor s={section} onChange={onChange} ctx={ctx} />;
    case "products": return <ProductsEditor s={section} onChange={onChange} ctx={ctx} />;
    case "combos": return <CombosEditor s={section} onChange={onChange} />;
    case "features": return <FeaturesEditor s={section} onChange={onChange} />;
    case "reels": return <ReelsEditor s={section} onChange={onChange} ctx={ctx} />;
    case "gallery": return <GalleryEditor s={section} onChange={onChange} ctx={ctx} />;
    case "reviews": return <ReviewsEditor s={section} onChange={onChange} ctx={ctx} />;
    case "newsletter": return <NewsletterEditor s={section} onChange={onChange} />;
  }
}

function useSet<T extends HomeSection>(s: T, onChange: (s: HomeSection) => void) {
  return (p: Partial<T>) => onChange({ ...s, ...p } as T);
}

function HeroEditor({ s, onChange, ctx }: { s: HeroSection; onChange: (s: HomeSection) => void; ctx: EditorContext }) {
  const set = useSet(s, onChange);
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-5">
        <Segmented label="Slide every" value={s.autoplaySeconds} options={[0, 4, 5, 6, 8, 10] as const} format={(v) => (v === 0 ? "Off" : `${v}s`)} onChange={(v) => set({ autoplaySeconds: v })} />
        <Segmented label="Height (desktop)" value={s.height} options={BANNER_HEIGHTS} format={(v) => v[0].toUpperCase() + v.slice(1)} onChange={(v) => set({ height: v })} />
      </div>
      <Segmented
        label="Phone banner height"
        value={((s as unknown) as { mobileAspect?: string }).mobileAspect ?? "4/3"}
        options={MOBILE_BANNER_ASPECTS}
        format={(v) => ({ "16/7": "Wide ✓", "16/9": "Landscape", "4/3": "Standard", "1/1": "Square", "4/5": "Portrait" })[v as string] ?? v}
        onChange={(v) => set({ mobileAspect: v } as Parameters<typeof set>[0])}
      />
      <p className="-mt-1 text-[11px] text-sky-950/60">
        Desktop: {BANNER_SIZE_HINT[s.height]}. &ldquo;Portrait&rdquo; shows the most image on phones. Slides save instantly.
      </p>
      <BannerManager banners={ctx.banners} height={s.height} mobileAspect={s.mobileAspect ?? "4/3"} destinations={ctx.destinations} />
    </div>
  );
}

function PromoEditor({ s, onChange, ctx }: { s: PromoSection; onChange: (s: HomeSection) => void; ctx: EditorContext }) {
  const set = useSet(s, onChange);
  const listId = React.useId();
  const setItem = (i: number, p: Partial<PromoItem>) => set({ items: s.items.map((it, j) => (j === i ? { ...it, ...p } : it)) });
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= s.items.length) return;
    const next = [...s.items];
    [next[i], next[j]] = [next[j], next[i]];
    set({ items: next });
  };
  const add = () => set({ items: [...s.items, { image: "", mobileImage: "", alt: "", href: "/combos", title: "", subtitle: "", ctaLabel: "", theme: "light", overlay: true }] });

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField label="Desktop shape" value={s.aspect} options={PROMO_ASPECTS.map((a) => ({ value: a, label: ASPECT_LABEL[a] }))} onChange={(v) => set({ aspect: v })} />
        <SelectField label="Phone shape" value={s.mobileAspect} options={PROMO_ASPECTS.map((a) => ({ value: a, label: ASPECT_LABEL[a] }))} onChange={(v) => set({ mobileAspect: v })} />
      </div>
      <p className="-mt-2 text-[11px] text-sky-950/60">
        Upload size: desktop {ASPECT_PX[s.aspect]}{s.items.length > 1 ? ` (each of ${s.items.length} side by side: about ${Math.round(1920 / s.items.length)} px wide)` : ""}, phone {ASPECT_PX[s.mobileAspect]}.
      </p>
      <div className="flex flex-wrap gap-5">
        <Segmented label="Several images on phones" value={s.mobileLayout} options={["stack", "scroll", "grid"] as const}
          format={(v) => ({ stack: "Stack", scroll: "Swipe", grid: "2 per row" })[v]} onChange={(v) => set({ mobileLayout: v })} />
      </div>
      <div className="grid gap-2 rounded-xl border border-sky-900/10 bg-white/40 p-3">
        <ToggleField label="Full width (edge to edge)" checked={s.fullWidth} onChange={(v) => set({ fullWidth: v })} />
        <ToggleField label="Rounded corners" checked={s.rounded} onChange={(v) => set({ rounded: v })} />
      </div>
      <details className="rounded-xl border border-sky-900/10 bg-white/40 p-3">
        <summary className="cursor-pointer text-sm font-medium text-sky-950">Section heading (optional)</summary>
        <div className="mt-3"><Heading s={s} set={set} /></div>
      </details>

      <datalist id={listId}>
        <option value="/combos">Combos</option>
        {ctx.destinations.map((d) => <option key={d.href} value={d.href}>{d.label}</option>)}
      </datalist>

      <ul className="grid gap-3">
        {s.items.map((it, i) => (
          <li key={i} className="grid gap-3 rounded-xl border border-sky-900/15 bg-white/60 p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-sky-950">Banner {i + 1}</p>
              <div className="flex">
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move left"><ArrowUp /></Button>
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => move(i, 1)} disabled={i === s.items.length - 1} aria-label="Move right"><ArrowDown /></Button>
                <Button type="button" variant="ghost" size="icon-sm" className="text-red-700" onClick={() => set({ items: s.items.filter((_, j) => j !== i) })} aria-label="Remove banner"><Trash2 /></Button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="mb-1.5 block text-xs">Desktop image *</Label>
                <SingleImageField id={`promo-${s.id}-${i}`} value={it.image} onChange={(u) => setItem(i, { image: u })} aspect={ASPECT_CLASS[s.aspect]} required />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs">Phone image (optional)</Label>
                <SingleImageField id={`promo-m-${s.id}-${i}`} value={it.mobileImage} onChange={(u) => setItem(i, { mobileImage: u })} aspect={ASPECT_CLASS[s.mobileAspect]} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField label="Link (where it opens)" value={it.href} max={200} list={listId} onChange={(v) => setItem(i, { href: v })} placeholder="/shop/jeans" />
              <TextField label="Image description (alt)" value={it.alt} max={160} onChange={(v) => setItem(i, { alt: v })} placeholder="Denim sale banner" />
            </div>
            <details>
              <summary className="cursor-pointer text-xs font-medium text-sky-900">Text on the banner (leave empty if text is in the image)</summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <TextField label="Headline" value={it.title} max={60} onChange={(v) => setItem(i, { title: v })} placeholder="Flat 30% off denim" />
                <TextField label="Button text" value={it.ctaLabel} max={30} onChange={(v) => setItem(i, { ctaLabel: v })} placeholder="Shop now" />
                <div className="sm:col-span-2"><TextField label="Subtext" value={it.subtitle} max={120} onChange={(v) => setItem(i, { subtitle: v })} /></div>
                <Segmented label="Text colour" value={it.theme} options={["light", "dark"] as const} format={(v) => (v === "light" ? "White" : "Dark")} onChange={(v) => setItem(i, { theme: v })} />
                <ToggleField label="Soft shade behind text" checked={it.overlay} onChange={(v) => setItem(i, { overlay: v })} />
              </div>
            </details>
          </li>
        ))}
      </ul>
      <Button type="button" variant="outline" size="sm" onClick={add} disabled={s.items.length >= 4} className="w-fit">
        <Plus /> Add banner image {s.items.length > 0 && `(${s.items.length}/4, shown side by side)`}
      </Button>
    </div>
  );
}

function CategoriesEditor({ s, onChange, ctx }: { s: CategoriesSection; onChange: (s: HomeSection) => void; ctx: EditorContext }) {
  const set = useSet(s, onChange);
  const custom = s.slugs.length > 0;
  const toggle = (slug: string) => set({ slugs: s.slugs.includes(slug) ? s.slugs.filter((x) => x !== slug) : [...s.slugs, slug] });
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= s.slugs.length) return;
    const next = [...s.slugs];
    [next[i], next[j]] = [next[j], next[i]];
    set({ slugs: next });
  };
  const bySlug = new Map(ctx.categories.map((c) => [c.slug, c]));
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label="Small label" value={s.eyebrow} max={30} onChange={(v) => set({ eyebrow: v })} />
        <TextField label="Title" value={s.title} max={60} onChange={(v) => set({ title: v })} />
      </div>
      <Segmented label="Which categories" value={custom ? "pick" : "home"} options={["home", "pick"] as const}
        format={(v) => (v === "home" ? "Homepage set" : "Choose here")}
        onChange={(v) => set({ slugs: v === "home" ? [] : ctx.categories.filter((c) => c.showOnHome !== false).slice(0, s.count).map((c) => c.slug) })} />
      {custom ? (
        <div className="grid gap-2 rounded-xl border border-sky-900/10 bg-white/40 p-3">
          <ol className="grid gap-1">
            {s.slugs.map((slug, i) => (
              <li key={slug} className="flex items-center gap-2 rounded-lg bg-white/70 px-2 py-1 text-sm">
                <span className="w-5 text-xs text-sky-950/50">{i + 1}</span>
                <span className="flex-1 truncate">{bySlug.get(slug)?.name ?? `${slug} (hidden)`}</span>
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"><ArrowUp /></Button>
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => move(i, 1)} disabled={i === s.slugs.length - 1} aria-label="Move down"><ArrowDown /></Button>
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => toggle(slug)} aria-label="Remove"><X /></Button>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-1.5">
            {ctx.categories.filter((c) => !s.slugs.includes(c.slug)).map((c) => (
              <button key={c.slug} type="button" onClick={() => toggle(c.slug)} className="rounded-full border border-sky-900/15 bg-white px-2.5 py-1 text-xs hover:border-sky-600">
                + {c.name}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="-mt-2 text-[11px] text-sky-950/60">
          Uses categories switched on for the homepage, in their order. <Link href="/admin/categories" className="font-medium text-sky-800 underline">Manage categories →</Link>
        </p>
      )}
      <div className="flex flex-wrap gap-5">
        <Segmented label="How many" value={s.count} options={CATEGORY_COUNTS} onChange={(v) => set({ count: v })} />
        <Segmented label="Per row (desktop)" value={s.perRow} options={CATEGORY_PER_ROW} onChange={(v) => set({ perRow: v })} />
        <Segmented label="Per row (phones)" value={(s.mobilePerRow ?? 3) as (typeof CATEGORY_MOBILE_COLS)[number]} options={CATEGORY_MOBILE_COLS} format={(v) => `${v}`} onChange={(v) => set({ mobilePerRow: v } as Parameters<typeof set>[0])} />
        <Segmented label="Box style" value={s.style} options={CATEGORY_STYLES} format={(v) => ({ tile: "Tiles", circle: "Circles", card: "Cards" })[v]} onChange={(v) => set({ style: v })} />
        <Segmented label="Phones" value={s.mobileLayout} options={["scroll", "grid"] as const} format={(v) => (v === "scroll" ? "Swipe" : "Grid")} onChange={(v) => set({ mobileLayout: v })} />
      </div>
      <div className="grid gap-2 rounded-xl border border-sky-900/10 bg-white/40 p-3">
        <ToggleField label="Show item count" checked={s.showCount} onChange={(v) => set({ showCount: v })} />
        <ToggleField label="“View all” link" checked={s.showViewAll} onChange={(v) => set({ showViewAll: v })} />
      </div>
    </div>
  );
}

function ProductsEditor({ s, onChange, ctx }: { s: ProductsSection; onChange: (s: HomeSection) => void; ctx: EditorContext }) {
  const set = useSet(s, onChange);
  const [q, setQ] = React.useState("");
  const byId = new Map(ctx.products.map((p) => [p.id, p]));
  const matches = ctx.products
    .filter((p) => !s.productIds.includes(p.id) && (!q.trim() || p.name.toLowerCase().includes(q.trim().toLowerCase())))
    .slice(0, 8);
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= s.productIds.length) return;
    const next = [...s.productIds];
    [next[i], next[j]] = [next[j], next[i]];
    set({ productIds: next });
  };
  return (
    <div className="grid gap-4">
      <Heading s={s} set={set} />
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField label="Show products from" value={s.source} options={PRODUCT_SOURCES.map((v) => ({ value: v, label: SOURCE_LABEL[v] }))} onChange={(v) => set({ source: v })} />
        {s.source === "category" ? (
          <SelectField label="Category" value={s.category || "__none"} options={[{ value: "__none", label: "Choose a category" }, ...ctx.categories.filter((c) => c.slug !== "combos").map((c) => ({ value: c.slug, label: c.name }))]}
            onChange={(v) => set({ category: v === "__none" ? "" : v })} />
        ) : s.source !== "manual" ? (
          <SelectField label="Order" value={s.sort} options={PRODUCT_SORTS.map((v) => ({ value: v, label: SORT_LABEL[v] }))} onChange={(v) => set({ sort: v })} />
        ) : null}
      </div>
      {s.source === "category" && (
        <SelectField label="Order" value={s.sort} options={PRODUCT_SORTS.map((v) => ({ value: v, label: SORT_LABEL[v] }))} onChange={(v) => set({ sort: v })} />
      )}

      {s.source === "manual" && (
        <div className="grid gap-2 rounded-xl border border-sky-900/10 bg-white/40 p-3">
          <p className="text-xs font-medium text-sky-950">Picked ({s.productIds.length}/24), shown in this order</p>
          <ol className="grid gap-1">
            {s.productIds.map((id, i) => {
              const p = byId.get(id);
              return (
                <li key={id} className="flex items-center gap-2 rounded-lg bg-white/70 p-1 pr-0 text-sm">
                  <span className="relative size-8 shrink-0 overflow-hidden rounded bg-white">
                    {p?.images[0] && isAllowedImageUrl(p.images[0]) && <Image src={p.images[0]} alt="" fill sizes="32px" className="object-cover" />}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{p?.name ?? "Product no longer available"}</span>
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"><ArrowUp /></Button>
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => move(i, 1)} disabled={i === s.productIds.length - 1} aria-label="Move down"><ArrowDown /></Button>
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => set({ productIds: s.productIds.filter((x) => x !== id) })} aria-label="Remove"><X /></Button>
                </li>
              );
            })}
          </ol>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-sky-950/40" aria-hidden />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products to add" className="h-9 pl-8" aria-label="Search products" />
          </div>
          <ul className="grid gap-1">
            {matches.map((p) => (
              <li key={p.id}>
                <button type="button" disabled={s.productIds.length >= 24} onClick={() => set({ productIds: [...s.productIds, p.id] })}
                  className="flex w-full items-center gap-2 rounded-lg p-1 text-left text-sm hover:bg-white disabled:opacity-50">
                  <span className="relative size-8 shrink-0 overflow-hidden rounded bg-white">
                    {p.images[0] && isAllowedImageUrl(p.images[0]) && <Image src={p.images[0]} alt="" fill sizes="32px" className="object-cover" />}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{p.name}</span>
                  <span className="text-xs text-sky-950/60">{formatINR(p.price)}</span>
                  <Plus className="size-4 text-sky-700" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-5">
        <Segmented label="How many" value={s.count} options={PRODUCT_COUNTS} onChange={(v) => set({ count: v })} />
        <Segmented label="Card size on desktop (per row)" value={s.perRow} options={CARD_PER_ROW} format={(v) => `${CARD_SIZE_LABEL[v]} · ${v}`} onChange={(v) => set({ perRow: v })} />
        <Segmented label="Layout" value={s.layout} options={["rail", "grid"] as const} format={(v) => (v === "rail" ? "Slider row" : "Grid")} onChange={(v) => set({ layout: v })} />
        <Segmented label="Card size on phones" value={s.mobileSize} options={MOBILE_CARD_SIZES} format={(v) => MOBILE_SIZE_LABEL[v]} onChange={(v) => set({ mobileSize: v })} />
      </div>
      <div className="grid gap-3 rounded-xl border border-sky-900/10 bg-white/40 p-3">
        <ToggleField label="“View all” link" checked={s.showViewAll} onChange={(v) => set({ showViewAll: v })} />
        {s.showViewAll && (
          <TextField label="“View all” goes to" value={s.viewAllHref} max={200} onChange={(v) => set({ viewAllHref: v })}
            placeholder={s.source === "category" && s.category ? `/shop/${s.category}` : "/shop/all-products"} hint="Leave empty for the automatic link." />
        )}
      </div>
    </div>
  );
}

function CombosEditor({ s, onChange }: { s: CombosSection; onChange: (s: HomeSection) => void }) {
  const set = useSet(s, onChange);
  return (
    <div className="grid gap-4">
      <Heading s={s} set={set} />
      <div className="flex flex-wrap gap-5">
        <Segmented label="Which combos" value={s.source} options={COMBO_SOURCES} format={(v) => ({ trending: "Trending", bestsellers: "Bestsellers", all: "All" })[v]} onChange={(v) => set({ source: v })} />
        <Segmented label="How many" value={s.count} options={COMBO_COUNTS} onChange={(v) => set({ count: v })} />
        <Segmented label="Card size on desktop (per row)" value={s.perRow} options={COMBO_PER_ROW} format={(v) => `${CARD_SIZE_LABEL[v]} · ${v}`} onChange={(v) => set({ perRow: v })} />
        <Segmented label="Phones" value={s.mobileLayout} options={["scroll", "grid"] as const} format={(v) => (v === "scroll" ? "Swipe" : "Grid")} onChange={(v) => set({ mobileLayout: v })} />
        <Segmented label="Card size on phones" value={s.mobileSize} options={MOBILE_CARD_SIZES} format={(v) => MOBILE_SIZE_LABEL[v]} onChange={(v) => set({ mobileSize: v })} />
      </div>
    </div>
  );
}

export function FeatureItemsEditor({ items, onChange, max }: { items: FeatureItem[]; onChange: (items: FeatureItem[]) => void; max: number }) {
  const setItem = (i: number, p: Partial<FeatureItem>) => onChange(items.map((it, j) => (j === i ? { ...it, ...p } : it)));
  return (
    <div className="grid gap-2">
      {items.map((it, i) => {
        const Icon = FEATURE_ICON_MAP[it.icon];
        return (
          <div key={i} className="grid grid-cols-[110px_1fr_auto] items-end gap-2 rounded-xl border border-sky-900/10 bg-white/50 p-2 sm:grid-cols-[110px_1fr_1fr_auto]">
            <SelectField label="Icon" value={it.icon} options={FEATURE_ICONS.map((v) => ({ value: v, label: FEATURE_LABEL[v] }))} onChange={(v) => setItem(i, { icon: v })} />
            <TextField label="Title" value={it.title} max={40} onChange={(v) => setItem(i, { title: v })} />
            <div className="col-span-2 row-start-2 sm:col-span-1 sm:row-start-auto">
              <TextField label="Text" value={it.text} max={70} onChange={(v) => setItem(i, { text: v })} />
            </div>
            <div className="flex items-center gap-1 pb-0.5">
              <Icon className="size-4 text-sky-900/50" aria-hidden />
              <Button type="button" variant="ghost" size="icon-sm" className="text-red-700" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Remove"><Trash2 /></Button>
            </div>
          </div>
        );
      })}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" size="sm" disabled={items.length >= max} onClick={() => onChange([...items, { icon: "star", title: "", text: "" }])}><Plus /> Add point</Button>
        <p className="text-[11px] text-sky-950/60">Tip: write <code className="rounded bg-white px-1">{"{freeShipping}"}</code> to show your live free-shipping amount.</p>
      </div>
    </div>
  );
}

function FeaturesEditor({ s, onChange }: { s: FeaturesSection; onChange: (s: HomeSection) => void }) {
  const set = useSet(s, onChange);
  return (
    <div className="grid gap-4">
      <Segmented label="Style" value={s.style} options={["plain", "cards"] as const} format={(v) => (v === "plain" ? "Plain" : "Cards")} onChange={(v) => set({ style: v })} />
      <FeatureItemsEditor items={s.items} onChange={(items) => set({ items })} max={6} />
    </div>
  );
}

function ReelsEditor({ s, onChange, ctx }: { s: ReelsSection; onChange: (s: HomeSection) => void; ctx: EditorContext }) {
  const set = useSet(s, onChange);
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label="Title" value={s.title} max={60} onChange={(v) => set({ title: v })} />
        <TextField label="Subtext" value={s.subtitle} max={120} onChange={(v) => set({ subtitle: v })} />
      </div>
      <div className="flex flex-wrap items-end gap-5">
        <Segmented label="How many reels" value={s.count} options={REEL_COUNTS} onChange={(v) => set({ count: v })} />
        <ToggleField label="Auto-play (muted)" checked={s.autoplay} onChange={(v) => set({ autoplay: v })} />
      </div>
      <SourceNote count={ctx.socialCount.reels} what="reels" href="/admin/instagram" label="Add reels in Instagram & reels" />
    </div>
  );
}

function GalleryEditor({ s, onChange, ctx }: { s: GallerySection; onChange: (s: HomeSection) => void; ctx: EditorContext }) {
  const set = useSet(s, onChange);
  return (
    <div className="grid gap-4">
      <TextField label="Title" value={s.title} max={60} onChange={(v) => set({ title: v })} />
      <Segmented label="How many tiles" value={s.count} options={GALLERY_COUNTS} onChange={(v) => set({ count: v })} />
      <SourceNote count={ctx.socialCount.gallery} what="posts" href="/admin/instagram" label="Add posts in Instagram & reels" />
    </div>
  );
}

function ReviewsEditor({ s, onChange, ctx }: { s: ReviewsSection; onChange: (s: HomeSection) => void; ctx: EditorContext }) {
  const set = useSet(s, onChange);
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label="Small label" value={s.eyebrow} max={30} onChange={(v) => set({ eyebrow: v })} />
        <TextField label="Title" value={s.title} max={60} onChange={(v) => set({ title: v })} />
      </div>
      <Segmented label="How many reviews" value={s.count} options={REVIEW_COUNTS} onChange={(v) => set({ count: v })} />
      <SourceNote count={ctx.reviewCount} what="approved reviews" href="/admin/reviews" label="Review queue" />
    </div>
  );
}

function NewsletterEditor({ s, onChange }: { s: NewsletterSection; onChange: (s: HomeSection) => void }) {
  const set = useSet(s, onChange);
  return (
    <div className="grid gap-3">
      <TextField label="Title" value={s.title} max={60} onChange={(v) => set({ title: v })} />
      <TextField label="Subtext" value={s.subtitle} max={120} onChange={(v) => set({ subtitle: v })} />
      <p className="text-[11px] text-sky-950/60">Sign-ups appear in Admin → Customers. The welcome coupon (NEW10) is shown only while it’s active.</p>
    </div>
  );
}

function SourceNote({ count, what, href, label }: { count: number; what: string; href: string; label: string }) {
  return (
    <p className={cn("text-[11px]", count === 0 ? "text-amber-800" : "text-sky-950/60")}>
      {count === 0 ? `No ${what} yet, so this section stays hidden on the store. ` : `${count} ${what} available. `}
      <Link href={href} className="font-medium text-sky-800 underline">{label} →</Link>
    </p>
  );
}
