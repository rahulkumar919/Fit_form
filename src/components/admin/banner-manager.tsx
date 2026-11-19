"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, CalendarClock, Monitor, Pencil, Plus, Smartphone, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { AdminBannerRow } from "@/services/homepage";
import type { BannerView } from "@/lib/homepage";
import type { HeroSection } from "@/lib/validations/homepage";
import { HeroCarousel, BANNER_SIZE_HINT } from "@/components/home/hero-carousel";
import { AdminCard, AdminCardContent, AdminCardHeader, AdminCardTitle } from "@/components/admin/admin-card";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { SingleImageField } from "@/components/admin/single-image-field";
import { Segmented } from "@/components/admin/segmented";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { adminSend } from "@/lib/admin-fetch";
import { isAllowedImageUrl } from "@/lib/catalog-constants";
import { cn } from "@/lib/utils";


const STATUS: Record<AdminBannerRow["status"], { label: string; cls: string }> = {
  live: { label: "Live", cls: "bg-emerald-100 text-emerald-800" },
  scheduled: { label: "Scheduled", cls: "bg-amber-100 text-amber-800" },
  expired: { label: "Ended", cls: "bg-slate-200 text-slate-700" },
  hidden: { label: "Hidden", cls: "bg-slate-200 text-slate-700" },
};

/** ISO → value for <input type="datetime-local"> in the browser's timezone. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);
const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

/* ───────────────────────── banner draft ───────────────────────── */

interface BannerDraft {
  id?: string;
  title: string;
  subtitle: string;
  eyebrow: string;
  image: string;
  mobileImage: string;
  alt: string;
  ctaLabel: string;
  ctaHref: string;
  highlights: [string, string, string];
  theme: "dark" | "light";
  overlay: boolean;
  isActive: boolean;
  startsAt: string; // datetime-local
  endsAt: string;
}

const EMPTY_BANNER: BannerDraft = {
  title: "", subtitle: "", eyebrow: "", image: "", mobileImage: "", alt: "",
  ctaLabel: "Shop now", ctaHref: "/combos", highlights: ["", "", ""],
  theme: "dark", overlay: true, isActive: true, startsAt: "", endsAt: "",
};

function rowToDraft(r: AdminBannerRow): BannerDraft {
  const h = [...r.highlights, "", "", ""].slice(0, 3) as [string, string, string];
  return {
    id: r.id, title: r.title, subtitle: r.subtitle, eyebrow: r.eyebrow, image: r.image,
    mobileImage: r.mobileImage, alt: r.alt, ctaLabel: r.ctaLabel, ctaHref: r.ctaHref, highlights: h,
    theme: r.theme, overlay: r.overlay, isActive: r.isActive,
    startsAt: toLocalInput(r.startsAt), endsAt: toLocalInput(r.endsAt),
  };
}

function draftToView(d: BannerDraft): BannerView {
  return {
    id: d.id ?? "draft",
    title: d.title.trim(), subtitle: d.subtitle.trim(), eyebrow: d.eyebrow.trim(),
    image: d.image.trim(), mobileImage: d.mobileImage.trim(), alt: d.alt.trim(),
    ctaLabel: d.ctaLabel.trim(), ctaHref: d.ctaHref.trim(),
    highlights: d.highlights.map((x) => x.trim()).filter(Boolean),
    theme: d.theme, overlay: d.overlay,
  };
}

/* ───────────────────────── main ───────────────────────── */

/** Hero slides CRUD (Banner collection). Saves immediately, independent of the layout save. */
export function BannerManager({
  banners, height, mobileAspect = "4/3", destinations,
}: {
  banners: AdminBannerRow[];
  height: HeroSection["height"];
  mobileAspect?: NonNullable<HeroSection["mobileAspect"]>;
  destinations: { label: string; href: string }[];
}) {
  const router = useRouter();
  const [rows, setRows] = React.useState(banners);
  const [draft, setDraft] = React.useState<BannerDraft | null>(null);
  const [savingBanner, setSavingBanner] = React.useState(false);
  const [toDelete, setToDelete] = React.useState<AdminBannerRow | null>(null);

  // Refresh local rows when the server sends new data.
  const [prevBanners, setPrevBanners] = React.useState(banners);
  if (prevBanners !== banners) {
    setPrevBanners(banners);
    setRows(banners);
  }

  const toggleBanner = async (r: AdminBannerRow, isActive: boolean) => {
    setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, isActive } : x)));
    try {
      await adminSend(`/api/admin/banners/${r.id}`, "PATCH", { isActive });
      router.refresh();
    } catch (e) {
      setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, isActive: !isActive } : x)));
      toast.error((e as Error).message);
    }
  };

  const moveBanner = async (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    const before = rows;
    setRows(next);
    try {
      await adminSend("/api/admin/banners/order", "PUT", { ids: next.map((r) => r.id) });
      router.refresh();
    } catch (e) {
      setRows(before);
      toast.error((e as Error).message);
    }
  };

  const saveBanner = async () => {
    if (!draft) return;
    setSavingBanner(true);
    try {
      const v = draftToView(draft);
      const body = {
        title: v.title, subtitle: v.subtitle, eyebrow: v.eyebrow, image: v.image, mobileImage: v.mobileImage,
        alt: v.alt, ctaLabel: v.ctaLabel, ctaHref: v.ctaHref, highlights: v.highlights, theme: v.theme,
        overlay: v.overlay, isActive: draft.isActive,
        startsAt: fromLocalInput(draft.startsAt), endsAt: fromLocalInput(draft.endsAt),
      };
      if (draft.id) await adminSend(`/api/admin/banners/${draft.id}`, "PATCH", body);
      else await adminSend("/api/admin/banners", "POST", body);
      toast.success(draft.id ? "Banner updated" : "Banner added");
      setDraft(null);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSavingBanner(false);
    }
  };

  const removeBanner = async () => {
    if (!toDelete) return;
    try {
      await adminSend(`/api/admin/banners/${toDelete.id}`, "DELETE");
      toast.success("Banner deleted");
      setToDelete(null);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
      throw e;
    }
  };

  return (
    <>

      <AdminCard>
        <AdminCardHeader>
          <AdminCardTitle>Hero banner slides</AdminCardTitle>
          <Button size="sm" className="btn-glass" onClick={() => setDraft({ ...EMPTY_BANNER, highlights: ["", "", ""] })}>
            <Plus /> New banner
          </Button>
        </AdminCardHeader>
        <AdminCardContent className="grid gap-5">
          <p className="-mt-2 text-xs text-sky-950/65">
            Recommended desktop image: <strong>{BANNER_SIZE_HINT[height]}</strong>. Optional phone image: 1080 × 1350 (4:5).
            Keep text and faces away from the edges.
          </p>

          {rows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-sky-900/20 p-8 text-center text-sm text-sky-950/70">
              No banners yet. Add your first one with a real product or campaign photo.
            </div>
          ) : (
            <ul className="grid gap-3">
              {rows.map((r, i) => (
                <li key={r.id} className={cn("flex flex-wrap items-center gap-3 rounded-xl border border-sky-900/10 bg-white/50 p-3", !r.isActive && "opacity-60")}>
                  <div className="flex flex-col">
                    <Button variant="ghost" size="icon-sm" onClick={() => moveBanner(i, -1)} disabled={i === 0} aria-label="Move banner up"><ArrowUp /></Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => moveBanner(i, 1)} disabled={i === rows.length - 1} aria-label="Move banner down"><ArrowDown /></Button>
                  </div>
                  <div className="relative aspect-[3/1] w-40 shrink-0 overflow-hidden rounded-lg bg-white">
                    <Image src={r.image} alt="" fill sizes="160px" className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-sky-950">{r.title || r.alt || "Image-only banner"}</p>
                    <p className="truncate text-xs text-sky-950/65">
                      {r.ctaHref ? `${r.ctaLabel || "Whole banner"} → ${r.ctaHref}` : "No link"}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                      <span className={cn("rounded-full px-2 py-0.5 font-medium", STATUS[r.status].cls)}>{STATUS[r.status].label}</span>
                      {(r.startsAt || r.endsAt) && (
                        <span className="inline-flex items-center gap-1 text-sky-950/65">
                          <CalendarClock className="size-3" aria-hidden />
                          {r.startsAt ? dateFmt.format(new Date(r.startsAt)) : "Now"} – {r.endsAt ? dateFmt.format(new Date(r.endsAt)) : "no end"}
                        </span>
                      )}
                      {r.mobileImage && <Badge variant="admin" className="text-[10px]">Phone image</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Switch checked={r.isActive} onCheckedChange={(v) => toggleBanner(r, v)} aria-label={`Show banner ${r.title || i + 1}`} />
                    <Button variant="ghost" size="icon-sm" onClick={() => setDraft(rowToDraft(r))} aria-label="Edit banner"><Pencil /></Button>
                    <Button variant="ghost" size="icon-sm" className="text-red-700" onClick={() => setToDelete(r)} aria-label="Delete banner"><Trash2 /></Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AdminCardContent>
      </AdminCard>


      <BannerDialog draft={draft} setDraft={setDraft} saving={savingBanner} onSave={saveBanner} height={height} mobileAspect={mobileAspect} destinations={destinations} />
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title="Delete this banner?"
        description="It will be removed from the homepage. The image stays in your media library."
        onConfirm={removeBanner}
      />
    </>
  );
}

function BannerDialog({
  draft, setDraft, saving, onSave, height, mobileAspect = "4/3", destinations,
}: {
  draft: BannerDraft | null;
  setDraft: React.Dispatch<React.SetStateAction<BannerDraft | null>>;
  saving: boolean;
  onSave: () => void;
  height: HeroSection["height"];
  mobileAspect?: NonNullable<HeroSection["mobileAspect"]>;
  destinations: { label: string; href: string }[];
}) {
  const set = <K extends keyof BannerDraft>(k: K, v: BannerDraft[K]) =>
    setDraft((d) => (d ? { ...d, [k]: v } : d));

  const raw = draft ? draftToView(draft) : null;
  const view = raw
    ? { ...raw, mobileImage: isAllowedImageUrl(raw.mobileImage) ? raw.mobileImage : "" }
    : null;
  const canPreview = !!view && isAllowedImageUrl(view.image);

  // Track which preview device the admin is looking at
  const [previewDevice, setPreviewDevice] = React.useState<"desktop" | "mobile">("desktop");

  return (
    <Dialog open={!!draft} onOpenChange={(v) => !v && !saving && setDraft(null)}>
      <DialogContent className="glass-dialog max-h-[92vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{draft?.id ? "Edit banner" : "New banner"}</DialogTitle>
          <DialogDescription>
            Leave the text empty if your image already has the text designed in. The whole banner
            then becomes the link.
          </DialogDescription>
        </DialogHeader>

        {draft && (
          <div className="grid gap-5">

            {/* ── Preview area ── */}
            <div className="overflow-hidden rounded-xl border border-sky-900/10 bg-background text-foreground">
              {/* Device toggle */}
              <div className="flex items-center justify-between border-b border-sky-900/10 px-3 py-2">
                <p className="text-xs font-medium text-sky-950/70">
                  {previewDevice === "desktop"
                    ? "Desktop preview"
                    : draft.mobileImage
                      ? "Mobile preview — using your phone image"
                      : "Mobile preview — using desktop image, scaled to phone"}
                </p>
                <div
                  role="radiogroup"
                  aria-label="Preview device"
                  className="inline-flex gap-1 rounded-xl border border-sky-900/10 bg-white/50 p-1"
                >
                  {(
                    [
                      ["desktop", Monitor, "Desktop"],
                      ["mobile", Smartphone, "Mobile"],
                    ] as const
                  ).map(([k, Icon, label]) => (
                    <button
                      key={k}
                      type="button"
                      role="radio"
                      aria-checked={previewDevice === k}
                      onClick={() => setPreviewDevice(k)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition",
                        previewDevice === k
                          ? "bg-sky-900 text-white"
                          : "text-sky-950/75 hover:bg-white",
                      )}
                    >
                      <Icon className="size-3.5" aria-hidden />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview frame */}
              <div className={cn("p-3", previewDevice === "mobile" && "flex justify-center bg-neutral-100/60")}>
                {canPreview ? (
                  <div
                    className={cn(
                      "overflow-hidden transition-all",
                      previewDevice === "mobile"
                        ? // Phone frame: 390px wide with a rounded border to simulate a phone screen
                        "w-full max-w-[390px] rounded-[2rem] border-8 border-neutral-900 shadow-2xl"
                        : "w-full rounded-xl",
                    )}
                  >
                    <HeroCarousel
                      banners={[view!]}
                      autoplaySeconds={0}
                      height={height}
                      mobileAspect={mobileAspect}
                      fallback={{ highlights: [] }}
                      preview
                    />
                  </div>
                ) : (
                  <div className="grid aspect-[3/1] place-items-center rounded-xl bg-muted text-sm text-muted-foreground">
                    Upload a desktop image to see the preview
                  </div>
                )}
              </div>

              {/* Responsive hint */}
              <div className="border-t border-sky-900/10 px-3 py-2">
                <p className="text-[11px] text-sky-950/60">
                  <strong>Desktop:</strong> {BANNER_SIZE_HINT[height]} recommended.&ensp;
                  <strong>Mobile:</strong>{" "}
                  {draft.mobileImage
                    ? "Your uploaded phone image will be shown."
                    : "Your desktop image automatically adapts — no cropping, keeps full proportions. Upload an optional phone image below for a custom mobile layout."}
                </p>
              </div>
            </div>

            {/* ── Image upload fields ── */}
            <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
              <div>
                <Label className="mb-1.5 block">
                  Desktop image <span className="text-red-700">*</span>
                </Label>
                <SingleImageField
                  id="bn-image"
                  value={draft.image}
                  onChange={(u) => set("image", u)}
                  aspect="aspect-[3/1]"
                  required
                  hint={`Recommended: ${BANNER_SIZE_HINT[height]}. Keep important content centred.`}
                />
              </div>
              <div>
                <Label className="mb-1.5 block">
                  Phone image{" "}
                  <span className="text-sky-950/50 font-normal">(optional)</span>
                </Label>
                <SingleImageField
                  id="bn-mobile"
                  value={draft.mobileImage}
                  onChange={(u) => {
                    set("mobileImage", u);
                    // Auto-switch to mobile preview when a mobile image is uploaded
                    if (u) setPreviewDevice("mobile");
                  }}
                  aspect="aspect-[4/5]"
                  hint="750 × 1000 px · 3:4 ratio. Falls back to desktop image if left empty."
                />
                {!draft.mobileImage && (
                  <p className="mt-1 text-[11px] text-sky-950/50">
                    Leave empty — the desktop image scales automatically.
                  </p>
                )}
              </div>
            </div>

            {/* ── Text fields ── */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="bn-eyebrow" className="mb-1.5 block">Small label</Label>
                <Input
                  id="bn-eyebrow"
                  value={draft.eyebrow}
                  maxLength={40}
                  onChange={(e) => set("eyebrow", e.target.value)}
                  placeholder="New season drop"
                />
              </div>
              <div>
                <Label htmlFor="bn-title" className="mb-1.5 block">Headline</Label>
                <Input
                  id="bn-title"
                  value={draft.title}
                  maxLength={80}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="Denim for every day"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="bn-sub" className="mb-1.5 block">Subtext</Label>
                <Input
                  id="bn-sub"
                  value={draft.subtitle}
                  maxLength={160}
                  onChange={(e) => set("subtitle", e.target.value)}
                  placeholder="Slim, straight and relaxed fits from ₹899."
                />
              </div>
              <div>
                <Label htmlFor="bn-cta" className="mb-1.5 block">Button text</Label>
                <Input
                  id="bn-cta"
                  value={draft.ctaLabel}
                  maxLength={30}
                  onChange={(e) => set("ctaLabel", e.target.value)}
                  placeholder="Shop jeans"
                />
              </div>
              <div>
                <Label htmlFor="bn-href" className="mb-1.5 block">Button link</Label>
                <Input
                  id="bn-href"
                  list="bn-destinations"
                  value={draft.ctaHref}
                  maxLength={200}
                  onChange={(e) => set("ctaHref", e.target.value)}
                  placeholder="/shop/jeans"
                />
                <datalist id="bn-destinations">
                  <option value="/combos">Combos</option>
                  {destinations.map((d) => (
                    <option key={d.href} value={d.href}>{d.label}</option>
                  ))}
                </datalist>
                <p className="mt-1 text-[11px] text-sky-950/60">
                  A store page, e.g. /shop/jeans, /combos, /product/… or a tracked link /l/…
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="mb-1.5 text-sm font-medium text-sky-950">
                  Highlights (optional, up to 3)
                </p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {draft.highlights.map((h, i) => (
                    <Input
                      key={i}
                      value={h}
                      maxLength={30}
                      aria-label={`Highlight ${i + 1}`}
                      onChange={(e) =>
                        set(
                          "highlights",
                          draft.highlights.map((x, j) =>
                            j === i ? e.target.value : x,
                          ) as BannerDraft["highlights"],
                        )
                      }
                      placeholder={
                        ["Cash on Delivery", "Easy exchanges", "Free shipping"][i]
                      }
                    />
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="bn-alt" className="mb-1.5 block">
                  Image description (alt text)
                </Label>
                <Input
                  id="bn-alt"
                  value={draft.alt}
                  maxLength={160}
                  onChange={(e) => set("alt", e.target.value)}
                  placeholder="Man in indigo denim jacket"
                />
              </div>
              <Segmented
                label="Text colour"
                value={draft.theme}
                options={["dark", "light"] as const}
                format={(v) => (v === "dark" ? "Dark (light photo)" : "White (dark photo)")}
                onChange={(v) => set("theme", v)}
              />
            </div>

            {/* ── Settings ── */}
            <div className="grid gap-4 rounded-xl border border-sky-900/10 bg-white/40 p-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm text-sky-950">
                <Switch
                  checked={draft.overlay}
                  onCheckedChange={(v) => set("overlay", v)}
                />
                Soft shade behind text
              </label>
              <label className="flex items-center gap-2 text-sm text-sky-950">
                <Switch
                  checked={draft.isActive}
                  onCheckedChange={(v) => set("isActive", v)}
                />
                Active
              </label>
              <div>
                <Label htmlFor="bn-start" className="mb-1.5 block text-xs">
                  Start showing (optional)
                </Label>
                <Input
                  id="bn-start"
                  type="datetime-local"
                  value={draft.startsAt}
                  onChange={(e) => set("startsAt", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="bn-end" className="mb-1.5 block text-xs">
                  Stop showing (optional)
                </Label>
                <Input
                  id="bn-end"
                  type="datetime-local"
                  value={draft.endsAt}
                  onChange={(e) => set("endsAt", e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setDraft(null)} disabled={saving}>
            Cancel
          </Button>
          <Button
            className="btn-glass"
            onClick={onSave}
            disabled={saving || !canPreview}
          >
            {saving ? "Saving…" : "Save banner"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
