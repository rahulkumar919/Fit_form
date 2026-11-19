"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminCard, AdminCardContent, AdminCardHeader, AdminCardTitle } from "@/components/admin/admin-card";
import { ImageListEditor } from "@/components/admin/image-list-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PRODUCT_CATEGORIES, SIZE_PRESETS } from "@/lib/catalog-constants";
import { productInputSchema, type ProductInput } from "@/lib/validations/product";
import { formatINR, slugify } from "@/lib/utils";

/* ───────────── form state (strings while typing) ───────────── */

interface SizeRow { size: string; available: string }
interface VariantRow { color: string; colorHex: string; images: string[]; sizes: SizeRow[] }
interface SourceRow {
  meeshoUrl: string; meeshoRef: string; supplier: string;
  sourcePrice: string; handlingCost: string; deliveryCost: string; otherCost: string; notes: string;
}
interface FormState {
  name: string; slug: string; slugTouched: boolean; category: string; description: string;
  highlights: string; material: string; care: string; price: string; compareAtPrice: string;
  images: string[]; variants: VariantRow[]; status: string;
  isNewArrival: boolean; isBestSeller: boolean; isTrending: boolean; isLimitedOffer: boolean;
  tags: string; seoTitle: string; seoDescription: string;
  hasSource: boolean; source: SourceRow;
  /* Social proof overrides */
  manualRating: string; manualReviewCount: string; manualSoldCount: string;
}

const EMPTY_SOURCE: SourceRow = {
  meeshoUrl: "", meeshoRef: "", supplier: "", sourcePrice: "", handlingCost: "40", deliveryCost: "60", otherCost: "20", notes: "",
};

function toState(v?: ProductInput): FormState {
  return {
    name: v?.name ?? "",
    slug: v?.slug ?? "",
    slugTouched: !!v,
    category: v?.category ?? "jeans",
    description: v?.description ?? "",
    highlights: (v?.highlights ?? []).join("\n"),
    material: v?.material ?? "",
    care: v?.care ?? "",
    price: v ? String(v.price) : "",
    compareAtPrice: v?.compareAtPrice ? String(v.compareAtPrice) : "",
    images: v?.images ?? [],
    variants: (v?.variants ?? []).map((x) => ({
      color: x.color, colorHex: x.colorHex, images: x.images,
      sizes: x.sizes.map((z) => ({ size: z.size, available: String(z.available) })),
    })),
    status: v?.status ?? "draft",
    isNewArrival: v?.isNewArrival ?? false,
    isBestSeller: v?.isBestSeller ?? false,
    isTrending: v?.isTrending ?? false,
    isLimitedOffer: v?.isLimitedOffer ?? false,
    tags: (v?.tags ?? []).join(", "),
    seoTitle: v?.seoTitle ?? "",
    seoDescription: v?.seoDescription ?? "",
    hasSource: !!v?.source,
    source: v?.source
      ? {
          meeshoUrl: v.source.meeshoUrl, meeshoRef: v.source.meeshoRef, supplier: v.source.supplier,
          sourcePrice: String(v.source.sourcePrice), handlingCost: String(v.source.handlingCost),
          deliveryCost: String(v.source.deliveryCost), otherCost: String(v.source.otherCost), notes: v.source.notes,
        }
      : EMPTY_SOURCE,
    manualRating:      v && (v as any).manualRating      ? String((v as any).manualRating)      : "",
    manualReviewCount: v && (v as any).manualReviewCount ? String((v as any).manualReviewCount) : "",
    manualSoldCount:   v && (v as any).manualSoldCount   ? String((v as any).manualSoldCount)   : "",
  };
}

const num = (s: string) => (s.trim() === "" ? NaN : Number(s));
const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);
const csv = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

function toPayload(s: FormState) {
  return {
    name: s.name, slug: s.slug, category: s.category, description: s.description,
    highlights: lines(s.highlights), material: s.material, care: s.care,
    price: num(s.price),
    compareAtPrice: s.compareAtPrice.trim() === "" ? null : num(s.compareAtPrice),
    images: s.images.map((x) => x.trim()).filter(Boolean),
    variants: s.variants.map((v) => ({
      color: v.color, colorHex: v.colorHex,
      images: v.images.map((x) => x.trim()).filter(Boolean),
      sizes: v.sizes.filter((z) => z.size.trim() !== "").map((z) => ({ size: z.size, available: z.available.trim() === "" ? 0 : num(z.available) })),
    })),
    status: s.status,
    isNewArrival: s.isNewArrival, isBestSeller: s.isBestSeller, isTrending: s.isTrending, isLimitedOffer: s.isLimitedOffer,
    tags: csv(s.tags), seoTitle: s.seoTitle, seoDescription: s.seoDescription,
    source: s.hasSource
      ? {
          meeshoUrl: s.source.meeshoUrl, meeshoRef: s.source.meeshoRef, supplier: s.source.supplier,
          sourcePrice: num(s.source.sourcePrice),
          handlingCost: num(s.source.handlingCost || "0"), deliveryCost: num(s.source.deliveryCost || "0"), otherCost: num(s.source.otherCost || "0"),
          notes: s.source.notes,
        }
      : null,
    manualRating:      s.manualRating.trim()      !== "" ? Math.min(5, Math.max(0, Number(s.manualRating)))      : null,
    manualReviewCount: s.manualReviewCount.trim() !== "" ? Math.max(0, Math.floor(Number(s.manualReviewCount))) : null,
    manualSoldCount:   s.manualSoldCount.trim()   !== "" ? Math.max(0, Math.floor(Number(s.manualSoldCount)))   : null,
  };
}

/* ───────────── small layout helpers ───────────── */

function Field({ label, htmlFor, hint, children, className }: { label: string; htmlFor?: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor} className="mb-1.5 block text-sky-950">{label}</Label>
      {children}
      {hint && <p className="mt-1 text-xs text-sky-950/65">{hint}</p>}
    </div>
  );
}

const textareaClass =
  "flex w-full rounded-lg border border-input bg-white/70 px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

interface Issue { path: string; message: string }

export interface UsedInCombo { id: string; name: string; slug: string; isActive: boolean }

export function ProductForm({
  mode,
  productId,
  initial,
  usedInCombos = [],
  categories = PRODUCT_CATEGORIES.map((c) => ({ slug: c.slug, label: c.label, isActive: true })),
}: {
  categories?: { slug: string; label: string; isActive: boolean }[];
  mode: "create" | "edit";
  productId?: string;
  initial?: ProductInput;
  usedInCombos?: UsedInCombo[];
}) {
  const router = useRouter();
  const [s, setS] = React.useState<FormState>(() => toState(initial));
  const [issues, setIssues] = React.useState<Issue[]>([]);
  const [saving, setSaving] = React.useState(false);
  const topRef = React.useRef<HTMLDivElement>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setS((p) => ({ ...p, [key]: value }));
  const setVariant = (i: number, patch: Partial<VariantRow>) =>
    setS((p) => ({ ...p, variants: p.variants.map((v, idx) => (idx === i ? { ...v, ...patch } : v)) }));
  const setSource = (patch: Partial<SourceRow>) => setS((p) => ({ ...p, source: { ...p.source, ...patch } }));

  const price = num(s.price);
  const src = s.source;
  const profit = s.hasSource && Number.isFinite(price)
    ? price - num(src.sourcePrice || "0") - num(src.handlingCost || "0") - num(src.deliveryCost || "0") - num(src.otherCost || "0")
    : null;
  const margin = profit !== null && price > 0 ? Math.round((profit / price) * 100) : null;

  const addVariant = () =>
    set("variants", [...s.variants, { color: "", colorHex: "#1f2937", images: [], sizes: [{ size: "", available: "10" }] }]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = toPayload(s);
    const parsed = productInputSchema.safeParse(payload);
    if (!parsed.success) {
      setIssues(parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })));
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setIssues([]);
    setSaving(true);
    try {
      const res = await fetch(mode === "create" ? "/api/admin/products" : `/api/admin/products/${productId}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        setIssues(json.issues ?? [{ path: "", message: json.message ?? "Could not save the product" }]);
        topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      toast.success(mode === "create" ? "Product created" : "Product saved");
      (json.data?.warnings as string[] | undefined)?.forEach((w) => toast.warning(w));
      router.push("/admin/products");
      router.refresh();
    } catch {
      setIssues([{ path: "", message: "Network error. Please try again." }]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-6" noValidate>
      <div ref={topRef} className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-sky-950">{mode === "create" ? "Add product" : "Edit product"}</h1>
          <p className="text-sm text-sky-950/70">
            {mode === "create" ? "Create a product, its colours/sizes and the Meesho source." : s.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link href="/admin/products">Cancel</Link></Button>
          <Button type="submit" className="btn-glass" disabled={saving}>
            <Save /> {saving ? "Saving…" : "Save product"}
          </Button>
        </div>
      </div>

      {issues.length > 0 && (
        <div role="alert" className="rounded-xl border border-red-300 bg-red-50/90 p-4 text-sm text-red-900">
          <p className="flex items-center gap-2 font-semibold"><AlertTriangle className="size-4" /> Please fix the following:</p>
          <ul className="mt-2 list-disc space-y-0.5 pl-5">
            {issues.slice(0, 10).map((i, idx) => (
              <li key={idx}>{i.path ? <span className="font-mono text-xs">{i.path}: </span> : null}{i.message}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          {/* Basics */}
          <AdminCard>
            <AdminCardHeader><AdminCardTitle>Basic information</AdminCardTitle></AdminCardHeader>
            <AdminCardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Product name" htmlFor="name" className="sm:col-span-2">
                  <Input id="name" value={s.name} maxLength={120} onChange={(e) => {
                    const name = e.target.value;
                    setS((p) => ({ ...p, name, slug: p.slugTouched ? p.slug : slugify(name) }));
                  }} />
                </Field>
                <Field label="URL slug" htmlFor="slug" hint={`/product/${s.slug || "…"}`}>
                  <Input id="slug" value={s.slug} onChange={(e) => setS((p) => ({ ...p, slug: slugify(e.target.value), slugTouched: true }))} />
                </Field>
                <Field label="Category" htmlFor="category">
                  <Select value={s.category} onValueChange={(v) => set("category", v)}>
                    <SelectTrigger id="category"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.slug} value={c.slug}>{c.label}{c.isActive ? "" : " (hidden)"}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Description" htmlFor="description" className="sm:col-span-2">
                  <textarea id="description" rows={5} value={s.description} onChange={(e) => set("description", e.target.value)} className={textareaClass} />
                </Field>
                <Field label="Highlights" htmlFor="highlights" hint="One per line (max 12)" className="sm:col-span-2">
                  <textarea id="highlights" rows={4} value={s.highlights} onChange={(e) => set("highlights", e.target.value)} className={textareaClass} />
                </Field>
                <Field label="Material" htmlFor="material"><Input id="material" value={s.material} onChange={(e) => set("material", e.target.value)} /></Field>
                <Field label="Care" htmlFor="care"><Input id="care" value={s.care} onChange={(e) => set("care", e.target.value)} /></Field>
                <Field label="Tags" htmlFor="tags" hint="Comma separated. Use “casual” / “party” to appear in Casual Wear / Party Wear." className="sm:col-span-2">
                  <Input id="tags" value={s.tags} onChange={(e) => set("tags", e.target.value)} placeholder="casual, denim, essentials" />
                </Field>
              </div>
            </AdminCardContent>
          </AdminCard>

          {/* Pricing */}
          <AdminCard>
            <AdminCardHeader><AdminCardTitle>Pricing</AdminCardTitle></AdminCardHeader>
            <AdminCardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Selling price (₹)" htmlFor="price">
                  <Input id="price" type="number" inputMode="numeric" min={1} value={s.price} onChange={(e) => set("price", e.target.value)} />
                </Field>
                <Field label="Compare-at price (₹)" htmlFor="compare" hint="Optional. Shown struck through; must be higher than the selling price.">
                  <Input id="compare" type="number" inputMode="numeric" min={1} value={s.compareAtPrice} onChange={(e) => set("compareAtPrice", e.target.value)} />
                </Field>
              </div>
              {Number.isFinite(price) && s.compareAtPrice && Number(s.compareAtPrice) > price && (
                <p className="mt-3 text-sm text-sky-950/70">
                  Customers see <b>{Math.round(((Number(s.compareAtPrice) - price) / Number(s.compareAtPrice)) * 100)}% off</b>.
                </p>
              )}
            </AdminCardContent>
          </AdminCard>

          {/* Images */}
          <AdminCard>
            <AdminCardHeader><AdminCardTitle>Product images</AdminCardTitle></AdminCardHeader>
            <AdminCardContent>
              <ImageListEditor idPrefix="img" value={s.images} onChange={(v) => set("images", v)} />
            </AdminCardContent>
          </AdminCard>

          {/* Variants */}
          <AdminCard>
            <AdminCardHeader>
              <AdminCardTitle>Colours, sizes &amp; availability</AdminCardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addVariant} disabled={s.variants.length >= 12}><Plus /> Add colour</Button>
            </AdminCardHeader>
            <AdminCardContent className="space-y-4">
              {s.variants.length === 0 && <p className="text-sm text-sky-950/70">No colours yet. Add at least one before publishing.</p>}
              {s.variants.map((v, i) => (
                <div key={i} className="rounded-xl border border-sky-900/10 bg-white/50 p-4">
                  <div className="flex flex-wrap items-end gap-3">
                    <Field label="Colour name" htmlFor={`vc-${i}`} className="min-w-40 flex-1">
                      <Input id={`vc-${i}`} value={v.color} onChange={(e) => setVariant(i, { color: e.target.value })} placeholder="Indigo" />
                    </Field>
                    <Field label="Swatch" htmlFor={`vh-${i}`}>
                      <input id={`vh-${i}`} type="color" value={v.colorHex} onChange={(e) => setVariant(i, { colorHex: e.target.value })}
                        className="h-10 w-14 cursor-pointer rounded-lg border border-input bg-white p-1" />
                    </Field>
                    <Button type="button" variant="ghost" size="sm" className="text-red-700" onClick={() => set("variants", s.variants.filter((_, idx) => idx !== i))}>
                      <Trash2 /> Remove colour
                    </Button>
                  </div>

                  <div className="mt-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-sky-950">Sizes &amp; units available</span>
                      <span className="text-xs text-sky-950/65">Quick fill:</span>
                      {SIZE_PRESETS.map((p) => (
                        <button key={p.label} type="button"
                          onClick={() => setVariant(i, { sizes: p.sizes.map((size) => ({ size, available: "10" })) })}
                          className="rounded-full border border-sky-900/15 bg-white/70 px-2.5 py-0.5 text-xs text-sky-900 hover:bg-white">
                          {p.label}
                        </button>
                      ))}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {v.sizes.map((z, j) => (
                        <div key={j} className="flex items-center gap-2">
                          <Input aria-label={`Size ${j + 1}`} value={z.size} placeholder="Size" className="h-9 w-24"
                            onChange={(e) => setVariant(i, { sizes: v.sizes.map((x, k) => (k === j ? { ...x, size: e.target.value } : x)) })} />
                          <Input aria-label={`Units for size ${z.size || j + 1}`} type="number" min={0} value={z.available} className="h-9 w-24"
                            onChange={(e) => setVariant(i, { sizes: v.sizes.map((x, k) => (k === j ? { ...x, available: e.target.value } : x)) })} />
                          {Number(z.available) === 0 && z.available !== "" && <Badge variant="danger" className="text-[10px]">Out of stock</Badge>}
                          <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove size"
                            onClick={() => setVariant(i, { sizes: v.sizes.filter((_, k) => k !== j) })}><Trash2 /></Button>
                        </div>
                      ))}
                    </div>
                    <Button type="button" variant="outline" size="sm" className="mt-2"
                      onClick={() => setVariant(i, { sizes: [...v.sizes, { size: "", available: "10" }] })}><Plus /> Add size</Button>
                  </div>

                  <div className="mt-4">
                    <p className="mb-2 text-sm font-medium text-sky-950">Images for this colour <span className="font-normal text-sky-950/65">(optional; falls back to the main images)</span></p>
                    <ImageListEditor idPrefix={`vimg-${i}`} max={10} value={v.images} onChange={(imgs) => setVariant(i, { images: imgs })} />
                  </div>
                </div>
              ))}
            </AdminCardContent>
          </AdminCard>

          {/* Source */}
          <AdminCard>
            <AdminCardHeader>
              <AdminCardTitle>Meesho source &amp; margin</AdminCardTitle>
              <div className="flex items-center gap-2">
                <Label htmlFor="has-source" className="text-xs text-sky-950/70">Link a Meesho product</Label>
                <Switch id="has-source" checked={s.hasSource} onCheckedChange={(v) => set("hasSource", v)} />
              </div>
            </AdminCardHeader>
            <AdminCardContent>
              {!s.hasSource ? (
                <p className="text-sm text-sky-950/70">No source linked. Linking one lets you track cost and profit per order.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Meesho product URL" htmlFor="m-url" className="sm:col-span-2">
                    <Input id="m-url" value={src.meeshoUrl} onChange={(e) => setSource({ meeshoUrl: e.target.value })} placeholder="https://www.meesho.com/…" />
                  </Field>
                  <Field label="Catalog / product reference" htmlFor="m-ref"><Input id="m-ref" value={src.meeshoRef} onChange={(e) => setSource({ meeshoRef: e.target.value })} /></Field>
                  <Field label="Supplier" htmlFor="m-sup"><Input id="m-sup" value={src.supplier} onChange={(e) => setSource({ supplier: e.target.value })} /></Field>
                  <Field label="Source price (₹)" htmlFor="m-price"><Input id="m-price" type="number" min={0} value={src.sourcePrice} onChange={(e) => setSource({ sourcePrice: e.target.value })} /></Field>
                  <Field label="Handling (₹)" htmlFor="m-h"><Input id="m-h" type="number" min={0} value={src.handlingCost} onChange={(e) => setSource({ handlingCost: e.target.value })} /></Field>
                  <Field label="Delivery (₹)" htmlFor="m-d"><Input id="m-d" type="number" min={0} value={src.deliveryCost} onChange={(e) => setSource({ deliveryCost: e.target.value })} /></Field>
                  <Field label="Other costs (₹)" htmlFor="m-o"><Input id="m-o" type="number" min={0} value={src.otherCost} onChange={(e) => setSource({ otherCost: e.target.value })} /></Field>
                  <Field label="Notes" htmlFor="m-n" className="sm:col-span-2"><Input id="m-n" value={src.notes} onChange={(e) => setSource({ notes: e.target.value })} /></Field>

                  <div className="sm:col-span-2 rounded-xl border border-sky-900/10 bg-white/60 p-4" aria-live="polite">
                    <p className="text-xs uppercase tracking-wide text-sky-950/65">Estimated profit per unit</p>
                    <p className={`mt-1 text-2xl font-bold ${profit !== null && profit < 0 ? "text-red-700" : "text-sky-950"}`}>
                      {profit === null || Number.isNaN(profit) ? "—" : formatINR(profit)}
                      {margin !== null && !Number.isNaN(margin) && <span className="ml-2 text-sm font-medium text-sky-950/70">({margin}% margin)</span>}
                    </p>
                    {profit !== null && profit < 0 && <p className="mt-1 text-sm text-red-700">You would lose money on every sale at this price.</p>}
                    <p className="mt-2 text-xs text-sky-950/65">
                      Meesho prices and availability change. Verify them on Meesho before fulfilling each order. Prices here are entered by you, never scraped.
                    </p>
                  </div>
                </div>
              )}
            </AdminCardContent>
          </AdminCard>

          {/* SEO */}
          <AdminCard>
            <AdminCardHeader><AdminCardTitle>Search engine listing</AdminCardTitle></AdminCardHeader>
            <AdminCardContent className="grid gap-4">
              {/* Auto-generate button */}
              {(s.name || s.description) && (
                <div className="flex items-center justify-between rounded-lg border border-sky-200 bg-sky-50/60 px-3 py-2.5">
                  <p className="text-xs text-sky-800">
                    {s.seoTitle || s.seoDescription
                      ? "SEO fields are set. Regenerate to overwrite with suggestions."
                      : "Auto-fill SEO fields from product details."}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="shrink-0 text-xs"
                    onClick={() => {
                      const catLabel = categories.find((c) => c.slug === s.category)?.label ?? s.category;
                      const autoTitle = `${s.name} — Buy Online India`.slice(0, 70);
                      const autoDesc = `${s.description.slice(0, 100)}${s.description.length > 100 ? "…" : ""} Shop ${s.name} in India. Free shipping above ₹1,999. Cash on Delivery available.`.slice(0, 160);
                      setS((p) => ({ ...p, seoTitle: autoTitle, seoDescription: autoDesc }));
                    }}
                  >
                    ✦ Auto-generate
                  </Button>
                </div>
              )}

              <Field label="SEO title" htmlFor="seo-t" hint={`${s.seoTitle.length}/70 characters. Leave blank to auto-generate from product name.`}>
                <Input
                  id="seo-t"
                  maxLength={70}
                  value={s.seoTitle}
                  onChange={(e) => set("seoTitle", e.target.value)}
                  placeholder={s.name ? `${s.name} — Buy Online India` : "Enter a compelling page title…"}
                />
                {/* Character bar */}
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${s.seoTitle.length > 65 ? "bg-amber-400" : "bg-emerald-500"}`}
                    style={{ width: `${Math.min((s.seoTitle.length / 70) * 100, 100)}%` }}
                  />
                </div>
              </Field>

              <Field label="Meta description" htmlFor="seo-d" hint={`${s.seoDescription.length}/160 characters. Leave blank to auto-generate from description.`}>
                <textarea
                  id="seo-d"
                  rows={3}
                  maxLength={160}
                  value={s.seoDescription}
                  onChange={(e) => set("seoDescription", e.target.value)}
                  placeholder="Describe what makes this product worth buying in 1–2 sentences…"
                  className={textareaClass}
                />
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${s.seoDescription.length > 150 ? "bg-amber-400" : "bg-emerald-500"}`}
                    style={{ width: `${Math.min((s.seoDescription.length / 160) * 100, 100)}%` }}
                  />
                </div>
              </Field>

              {/* Search result preview */}
              {(s.seoTitle || s.name) && (
                <div className="rounded-xl border border-border bg-white p-4">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Google preview</p>
                  <div className="space-y-0.5">
                    <p className="text-xs text-green-700 truncate">melamart.in › product › {s.slug || "product-slug"}</p>
                    <p className="text-base font-medium text-blue-700 leading-tight line-clamp-1">
                      {(s.seoTitle || `${s.name} — Buy Online India`).slice(0, 60)}
                      {!s.seoTitle && " | MelaMart"}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-snug">
                      {s.seoDescription ||
                        (s.description
                          ? `${s.description.slice(0, 130)}…`
                          : "No description set. Add a meta description for better click-through rates.")}
                    </p>
                  </div>
                </div>
              )}

              {/* Keyword suggestions */}
              {s.name && (
                <div>
                  <p className="mb-2 text-xs font-medium text-sky-950">Keyword suggestions <span className="font-normal text-sky-950/60">(based on product details — not verified search volumes)</span></p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      s.name,
                      `${s.name} online India`,
                      `buy ${s.name}`,
                      ...(categories.find((c) => c.slug === s.category)?.label
                        ? [`men's ${categories.find((c) => c.slug === s.category)!.label} India`,
                           `${categories.find((c) => c.slug === s.category)!.label} for men`]
                        : []),
                      ...(s.material ? [`${s.material} ${categories.find((c) => c.slug === s.category)?.label ?? ""}`.trim()] : []),
                      "Cash on Delivery",
                      "free shipping India",
                      "MelaMart",
                    ]
                      .filter(Boolean)
                      .slice(0, 8)
                      .map((kw) => (
                        <span key={kw} className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[11px] text-sky-800">
                          {kw}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {/* SEO warnings */}
              {(() => {
                const warnings: string[] = [];
                if (!s.images.length) warnings.push("Add at least one product image — required for Google Shopping.");
                if (!s.description.trim()) warnings.push("Product description is empty — required for good search visibility.");
                if (s.seoTitle.length > 0 && s.seoTitle.length < 30) warnings.push("SEO title is very short. Aim for 50–60 characters.");
                if (s.seoDescription.length > 0 && s.seoDescription.length < 70) warnings.push("Meta description is very short. Aim for 120–155 characters.");
                if (!warnings.length) return null;
                return (
                  <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-800 space-y-1">
                    {warnings.map((w, i) => <p key={i}>⚠ {w}</p>)}
                  </div>
                );
              })()}
            </AdminCardContent>
          </AdminCard>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          <AdminCard>
            <AdminCardHeader><AdminCardTitle>Status</AdminCardTitle></AdminCardHeader>
            <AdminCardContent>
              <Select value={s.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger aria-label="Status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active (visible on the store)</SelectItem>
                  <SelectItem value="draft">Draft (hidden)</SelectItem>
                  <SelectItem value="archived">Archived (hidden)</SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-2 text-xs text-sky-950/65">Active products need at least one image and one colour with sizes.</p>
            </AdminCardContent>
          </AdminCard>

          <AdminCard>
            <AdminCardHeader><AdminCardTitle>Labels</AdminCardTitle></AdminCardHeader>
            <AdminCardContent className="space-y-3">
              {([
                ["isNewArrival", "New arrival"],
                ["isBestSeller", "Best seller"],
                ["isTrending", "Trending"],
                ["isLimitedOffer", "Limited offer"],
              ] as const).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <Label htmlFor={key} className="font-normal text-sky-950">{label}</Label>
                  <Switch id={key} checked={s[key]} onCheckedChange={(v) => set(key, v)} />
                </div>
              ))}
            </AdminCardContent>
          </AdminCard>

          {/* ── Social Proof Overrides ── */}
          <AdminCard>
            <AdminCardHeader>
              <AdminCardTitle>Social Proof</AdminCardTitle>
            </AdminCardHeader>
            <AdminCardContent className="space-y-4">
              <p className="text-xs text-sky-950/65 leading-relaxed">
                Set fake numbers to build trust. These are shown on the store when real data is 0.
                Real reviews and actual orders always add on top.
              </p>

              <Field label="Fake rating (0–5)" htmlFor="manualRating" hint="e.g. 4.6 — shown as stars">
                <Input
                  id="manualRating"
                  type="number"
                  min="0" max="5" step="0.1"
                  placeholder="e.g. 4.6"
                  value={s.manualRating}
                  onChange={(e) => set("manualRating", e.target.value)}
                />
              </Field>

              <Field label="Fake review count" htmlFor="manualReviewCount" hint='e.g. 128 — shown as "(128 ratings)"'>
                <Input
                  id="manualReviewCount"
                  type="number"
                  min="0" step="1"
                  placeholder="e.g. 128"
                  value={s.manualReviewCount}
                  onChange={(e) => set("manualReviewCount", e.target.value)}
                />
              </Field>

              <Field label="Fake sold count" htmlFor="manualSoldCount" hint='e.g. 320 — shown as "🔥 320+ sold"'>
                <Input
                  id="manualSoldCount"
                  type="number"
                  min="0" step="1"
                  placeholder="e.g. 320"
                  value={s.manualSoldCount}
                  onChange={(e) => set("manualSoldCount", e.target.value)}
                />
              </Field>

              {/* Live preview */}
              {(s.manualRating || s.manualReviewCount || s.manualSoldCount) && (
                <div className="rounded-lg border border-sky-100 bg-sky-50/60 p-3 space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-700 mb-2">Store preview</p>
                  {s.manualRating && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-amber-400 text-sm">{"★".repeat(Math.round(Number(s.manualRating)))}</span>
                      <span className="text-xs font-semibold text-gray-800">{Number(s.manualRating).toFixed(1)}</span>
                      {s.manualReviewCount && (
                        <span className="text-xs text-gray-500">({s.manualReviewCount})</span>
                      )}
                    </div>
                  )}
                  {s.manualSoldCount && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 border border-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                      🔥 {s.manualSoldCount}+ sold
                    </span>
                  )}
                </div>
              )}
            </AdminCardContent>
          </AdminCard>

          {mode === "edit" && (
            <AdminCard>
              <AdminCardHeader><AdminCardTitle>Used in combos</AdminCardTitle></AdminCardHeader>
              <AdminCardContent>
                {usedInCombos.length === 0 ? (
                  <p className="text-sm text-sky-950/70">Not part of any combo.</p>
                ) : (
                  <ul className="space-y-2">
                    {usedInCombos.map((c) => (
                      <li key={c.id} className="flex items-center justify-between gap-2 text-sm">
                        <Link href={`/admin/combos/${c.id}/edit`} className="font-medium text-sky-800 underline-offset-2 hover:underline">{c.name}</Link>
                        <Badge variant={c.isActive ? "success" : "muted"} className="text-[10px]">{c.isActive ? "Active" : "Hidden"}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-3 text-xs text-sky-950/65">Changing price, sizes or colours updates these combos automatically.</p>
              </AdminCardContent>
            </AdminCard>
          )}
        </div>
      </div>
    </form>
  );
}
