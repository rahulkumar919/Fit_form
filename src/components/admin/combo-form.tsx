"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowDown, ArrowUp, Save, X } from "lucide-react";
import { toast } from "sonner";
import { AdminCard, AdminCardContent, AdminCardHeader, AdminCardTitle } from "@/components/admin/admin-card";
import { ImageListEditor } from "@/components/admin/image-list-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { comboInputSchema, type ComboInput } from "@/lib/validations/combo";
import type { PickerProduct } from "@/services/admin";
import { formatINR, slugify } from "@/lib/utils";

const textareaClass =
  "flex w-full rounded-lg border border-input bg-white/70 px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

interface Issue { path: string; message: string }

export function ComboForm({
  mode,
  comboId,
  initial,
  products,
}: {
  mode: "create" | "edit";
  comboId?: string;
  initial?: ComboInput;
  products: PickerProduct[];
}) {
  const router = useRouter();
  const [name, setName] = React.useState(initial?.name ?? "");
  const [slug, setSlug] = React.useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = React.useState(!!initial);
  const [tagline, setTagline] = React.useState(initial?.tagline ?? "");
  const [description, setDescription] = React.useState(initial?.description ?? "");
  const [images, setImages] = React.useState<string[]>(initial?.images ?? []);
  const [productIds, setProductIds] = React.useState<string[]>(initial?.productIds ?? []);
  const [comboPrice, setComboPrice] = React.useState(initial ? String(initial.comboPrice) : "");
  const [tags, setTags] = React.useState((initial?.tags ?? []).join(", "));
  const [isTrending, setIsTrending] = React.useState(initial?.isTrending ?? false);
  const [isBestSeller, setIsBestSeller] = React.useState(initial?.isBestSeller ?? false);
  const [isActive, setIsActive] = React.useState(initial?.isActive ?? true);
  const [reelRef, setReelRef] = React.useState(initial?.reelRef ?? "");
  const [seoTitle, setSeoTitle] = React.useState(initial?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = React.useState(initial?.seoDescription ?? "");
  const [query, setQuery] = React.useState("");
  const [issues, setIssues] = React.useState<Issue[]>([]);
  const [saving, setSaving] = React.useState(false);
  const topRef = React.useRef<HTMLDivElement>(null);

  const byId = React.useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const selected = productIds.map((id) => byId.get(id)).filter(Boolean) as PickerProduct[];
  const combinedPrice = selected.reduce((sum, p) => sum + p.price, 0);
  const price = comboPrice.trim() === "" ? NaN : Number(comboPrice);
  const savings = Number.isFinite(price) ? combinedPrice - price : NaN;
  const missing = productIds.filter((id) => !byId.has(id));

  const toggle = (id: string) =>
    setProductIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 8 ? prev : [...prev, id]));
  const move = (i: number, dir: -1 | 1) =>
    setProductIds((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const filtered = products.filter((p) => `${p.name} ${p.categoryLabel}`.toLowerCase().includes(query.trim().toLowerCase()));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name, slug, tagline, description,
      images: images.map((x) => x.trim()).filter(Boolean),
      productIds,
      comboPrice: price,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      isTrending, isBestSeller, isActive, reelRef, seoTitle, seoDescription,
    };
    const parsed = comboInputSchema.safeParse(payload);
    const local: Issue[] = parsed.success ? [] : parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
    if (parsed.success && price >= combinedPrice) {
      local.push({ path: "comboPrice", message: `Combo price must be lower than the products' total (${formatINR(combinedPrice)})` });
    }
    if (local.length) {
      setIssues(local);
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setIssues([]);
    setSaving(true);
    try {
      const res = await fetch(mode === "create" ? "/api/admin/combos" : `/api/admin/combos/${comboId}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        setIssues(json.issues ?? [{ path: "", message: json.message ?? "Could not save the combo" }]);
        topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      toast.success(mode === "create" ? "Combo created" : "Combo saved");
      router.push("/admin/combos");
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
          <h1 className="text-2xl font-bold tracking-tight text-sky-950">{mode === "create" ? "Create combo" : "Edit combo"}</h1>
          <p className="text-sm text-sky-950/70">Pick the products. Customers still choose a separate size and colour for each item.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link href="/admin/combos">Cancel</Link></Button>
          <Button type="submit" className="btn-glass" disabled={saving}><Save /> {saving ? "Saving…" : "Save combo"}</Button>
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

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-6">
          <AdminCard>
            <AdminCardHeader><AdminCardTitle>Details</AdminCardTitle></AdminCardHeader>
            <AdminCardContent className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="c-name" className="mb-1.5 block">Combo name</Label>
                <Input id="c-name" value={name} maxLength={120} onChange={(e) => { setName(e.target.value); if (!slugTouched) setSlug(slugify(e.target.value)); }} />
              </div>
              <div>
                <Label htmlFor="c-slug" className="mb-1.5 block">URL slug</Label>
                <Input id="c-slug" value={slug} onChange={(e) => { setSlug(slugify(e.target.value)); setSlugTouched(true); }} />
                <p className="mt-1 text-xs text-sky-950/65">/combo/{slug || "…"}</p>
              </div>
              <div>
                <Label htmlFor="c-tag" className="mb-1.5 block">Tagline</Label>
                <Input id="c-tag" value={tagline} maxLength={120} onChange={(e) => setTagline(e.target.value)} placeholder="Tee + Jeans + Sneakers" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="c-desc" className="mb-1.5 block">Description</Label>
                <textarea id="c-desc" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className={textareaClass} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="c-tags" className="mb-1.5 block">Tags</Label>
                <Input id="c-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="casual, streetwear" />
              </div>
            </AdminCardContent>
          </AdminCard>

          <AdminCard>
            <AdminCardHeader>
              <AdminCardTitle>Products in this combo ({productIds.length}/8)</AdminCardTitle>
            </AdminCardHeader>
            <AdminCardContent className="space-y-4">
              {missing.length > 0 && (
                <p className="rounded-lg bg-amber-100/80 p-3 text-sm text-amber-900">
                  {missing.length} product(s) in this combo are no longer active and will be rejected on save. Remove them below.
                </p>
              )}
              {selected.length > 0 && (
                <ol className="space-y-2">
                  {selected.map((p, i) => (
                    <li key={p.id} className="flex items-center gap-3 rounded-xl border border-sky-900/10 bg-white/60 p-2">
                      <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-white">
                        {p.image && <Image src={p.image} alt="" fill sizes="40px" className="object-cover" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-sky-950">{p.name}</p>
                        <p className="text-xs text-sky-950/70">{p.categoryLabel} · {formatINR(p.price)}</p>
                      </div>
                      <Button type="button" variant="ghost" size="icon-sm" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp /></Button>
                      <Button type="button" variant="ghost" size="icon-sm" aria-label="Move down" disabled={i === selected.length - 1} onClick={() => move(i, 1)}><ArrowDown /></Button>
                      <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove ${p.name}`} onClick={() => toggle(p.id)}><X /></Button>
                    </li>
                  ))}
                </ol>
              )}
              {missing.map((id) => (
                <div key={id} className="flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50/80 p-2 text-sm">
                  <span>Unavailable product</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => toggle(id)}>Remove</Button>
                </div>
              ))}

              <div>
                <Label htmlFor="c-search" className="mb-1.5 block">Add products</Label>
                <Input id="c-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search active products…" />
                <div className="mt-2 max-h-72 overflow-y-auto rounded-xl border border-sky-900/10 bg-white/50">
                  {filtered.length === 0 && <p className="p-4 text-sm text-sky-950/70">{products.length === 0 ? "No active products yet." : "No matches."}</p>}
                  {filtered.map((p) => {
                    const on = productIds.includes(p.id);
                    return (
                      <label key={p.id} className="flex cursor-pointer items-center gap-3 border-b border-sky-900/5 px-3 py-2 last:border-0 hover:bg-white/70">
                        <input type="checkbox" checked={on} onChange={() => toggle(p.id)} disabled={!on && productIds.length >= 8} className="size-4 accent-sky-600" />
                        <div className="relative size-9 shrink-0 overflow-hidden rounded-md bg-white">
                          {p.image && <Image src={p.image} alt="" fill sizes="36px" className="object-cover" />}
                        </div>
                        <span className="min-w-0 flex-1 truncate text-sm text-sky-950">{p.name}</span>
                        <span className="text-xs text-sky-950/70">{p.categoryLabel}</span>
                        <span className="text-sm font-medium text-sky-950">{formatINR(p.price)}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </AdminCardContent>
          </AdminCard>

          <AdminCard>
            <AdminCardHeader>
              <AdminCardTitle>Combo images</AdminCardTitle>
              <Button type="button" variant="outline" size="sm" onClick={() => setImages(selected.map((p) => p.image).filter(Boolean).slice(0, 3))} disabled={selected.length === 0}>
                Use product images
              </Button>
            </AdminCardHeader>
            <AdminCardContent>
              <ImageListEditor idPrefix="cimg" max={10} value={images} onChange={setImages} />
              <p className="mt-2 text-xs text-sky-950/65">Leave empty to use the first images of the selected products.</p>
            </AdminCardContent>
          </AdminCard>

          <AdminCard>
            <AdminCardHeader><AdminCardTitle>Search engine listing</AdminCardTitle></AdminCardHeader>
            <AdminCardContent className="grid gap-4">
              <div>
                <Label htmlFor="c-seo-t" className="mb-1.5 block">SEO title</Label>
                <Input id="c-seo-t" maxLength={70} value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="c-seo-d" className="mb-1.5 block">Meta description</Label>
                <textarea id="c-seo-d" rows={2} maxLength={170} value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} className={textareaClass} />
              </div>
            </AdminCardContent>
          </AdminCard>
        </div>

        <div className="flex flex-col gap-6">
          <AdminCard>
            <AdminCardHeader><AdminCardTitle>Pricing</AdminCardTitle></AdminCardHeader>
            <AdminCardContent className="space-y-3" aria-live="polite">
              <div className="flex justify-between text-sm"><span className="text-sky-950/70">Products total</span><span className="font-semibold">{formatINR(combinedPrice)}</span></div>
              <div>
                <Label htmlFor="c-price" className="mb-1.5 block">Combo price (₹)</Label>
                <Input id="c-price" type="number" inputMode="numeric" min={1} value={comboPrice} onChange={(e) => setComboPrice(e.target.value)} />
              </div>
              {Number.isFinite(savings) && selected.length > 0 && (
                savings > 0 ? (
                  <p className="rounded-lg bg-emerald-100/80 p-3 text-sm text-emerald-900">
                    Customers save <b>{formatINR(savings)}</b> ({Math.round((savings / combinedPrice) * 100)}%).
                  </p>
                ) : (
                  <p className="rounded-lg bg-red-100/80 p-3 text-sm text-red-900">Combo price must be below {formatINR(combinedPrice)}.</p>
                )
              )}
              <p className="text-xs text-sky-950/65">The total is recalculated from live product prices when you save.</p>
            </AdminCardContent>
          </AdminCard>

          <AdminCard>
            <AdminCardHeader><AdminCardTitle>Visibility</AdminCardTitle></AdminCardHeader>
            <AdminCardContent className="space-y-3">
              {([
                ["Active (visible on the store)", isActive, setIsActive, "c-active"],
                ["Trending", isTrending, setIsTrending, "c-trend"],
                ["Best seller", isBestSeller, setIsBestSeller, "c-best"],
              ] as const).map(([label, value, setter, id]) => (
                <div key={id} className="flex items-center justify-between">
                  <Label htmlFor={id} className="font-normal text-sky-950">{label}</Label>
                  <Switch id={id} checked={value} onCheckedChange={setter} />
                </div>
              ))}
              <div className="pt-2">
                <Label htmlFor="c-reel" className="mb-1.5 block">Reel reference</Label>
                <Input id="c-reel" value={reelRef} onChange={(e) => setReelRef(e.target.value)} placeholder="instagram_reel_01" />
                <p className="mt-1 text-xs text-sky-950/65">Tag added to this combo’s share link (?ref=…) so visits are attributed. Reels are managed in Admin → Instagram.</p>
              </div>
            </AdminCardContent>
          </AdminCard>
        </div>
      </div>
    </form>
  );
}
