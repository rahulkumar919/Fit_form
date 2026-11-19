"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDown, ArrowUp, Copy, ExternalLink, Eye, EyeOff, GalleryHorizontal, GripVertical, Images, LayoutGrid, Mail,
  Monitor, Plus, RotateCcw, Save, ShieldCheck, ShoppingBag, Shapes, Smartphone, Star, Trash2, Clapperboard, Layers,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import type { AdminBannerRow } from "@/services/homepage";
import { DEFAULT_FOOTER, SECTION_META, createSection, newSectionId } from "@/lib/homepage";
import type { FooterConfig, HomeSection, HomepageSettings, SectionType } from "@/lib/validations/homepage";
import { BOTTOM_NAV_ITEMS, SECTION_TYPES, type BottomNavItem } from "@/lib/validations/homepage";
import { BOTTOM_NAV_META, BottomNav } from "@/components/layout/bottom-nav";
import { normaliseHandle } from "@/lib/instagram";
import { RenderSection, type HomeData } from "@/components/home/home-sections";
import { Footer, type FooterStore } from "@/components/layout/footer";
import { InstagramIcon } from "@/components/icons/instagram";
import { AdminCard, AdminCardContent, AdminCardHeader, AdminCardTitle } from "@/components/admin/admin-card";
import { FeatureItemsEditor, SectionEditor, TextField, ToggleField, type EditorContext } from "@/components/admin/section-editors";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { adminSend } from "@/lib/admin-fetch";
import { cn } from "@/lib/utils";

const ICON: Record<SectionType, LucideIcon> = {
  hero: GalleryHorizontal, promo: Images, categories: Shapes, products: ShoppingBag, combos: Layers,
  features: ShieldCheck, reels: Clapperboard, gallery: LayoutGrid, reviews: Star, newsletter: Mail,
};

function summary(s: HomeSection): string {
  switch (s.type) {
    case "hero": return `${s.height} · ${s.autoplaySeconds ? `${s.autoplaySeconds}s` : "no autoplay"}`;
    case "promo": return `${s.items.length} image${s.items.length === 1 ? "" : "s"} · ${s.aspect}`;
    case "categories": return `${s.title || "Untitled"} · ${s.count} ${s.style}s`;
    case "products": return `${s.title || "Untitled"} · ${s.source}${s.source === "category" && s.category ? `: ${s.category}` : ""} · ${s.perRow}/row`;
    case "combos": return `${s.title || "Untitled"} · ${s.count} · ${s.perRow}/row`;
    case "features": return `${s.items.length} points`;
    case "reels": case "gallery": case "newsletter": return s.title || "Untitled";
    case "reviews": return `${s.title} · ${s.count}`;
  }
}

type Tab = "page" | "footer" | "social";

export function HomepageBuilder({
  layout: saved, data, banners, footerStore, phone, ctx,
}: {
  layout: HomepageSettings;
  data: HomeData;
  banners: AdminBannerRow[];
  footerStore: FooterStore;
  phone: string;
  ctx: Omit<EditorContext, "banners">;
}) {
  const router = useRouter();
  const [layout, setLayout] = React.useState(saved);
  const [prevSaved, setPrevSaved] = React.useState(saved);
  if (prevSaved !== saved) { setPrevSaved(saved); setLayout(saved); }
  const [selected, setSelected] = React.useState<string | null>(saved.sections[0]?.id ?? null);
  const [tab, setTab] = React.useState<Tab>("page");
  const [device, setDevice] = React.useState<"desktop" | "mobile">("desktop");
  const [adding, setAdding] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [dragId, setDragId] = React.useState<string | null>(null);
  const previewRef = React.useRef<HTMLDivElement>(null);

  const dirty = JSON.stringify(layout) !== JSON.stringify(saved);
  const sections = layout.sections;
  const setSections = (next: HomeSection[]) => setLayout((l) => ({ ...l, sections: next }));
  const update = (s: HomeSection) => setSections(sections.map((x) => (x.id === s.id ? s : x)));
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= sections.length) return;
    const next = [...sections];
    [next[i], next[j]] = [next[j], next[i]];
    setSections(next);
  };
  const duplicate = (s: HomeSection) => {
    const i = sections.findIndex((x) => x.id === s.id);
    const copy = { ...structuredClone(s), id: newSectionId() } as HomeSection;
    setSections([...sections.slice(0, i + 1), copy, ...sections.slice(i + 1)]);
    setSelected(copy.id);
  };
  const remove = (s: HomeSection) => {
    if (!window.confirm(`Remove “${SECTION_META[s.type].label}” from the homepage?`)) return;
    setSections(sections.filter((x) => x.id !== s.id));
    if (selected === s.id) setSelected(null);
  };
  const add = (type: SectionType) => {
    const s = createSection(type);
    const i = selected ? sections.findIndex((x) => x.id === selected) : -1;
    const at = i >= 0 ? i + 1 : sections.length;
    setSections([...sections.slice(0, at), s, ...sections.slice(at)]);
    setSelected(s.id);
    setAdding(false);
    setTab("page");
  };
  const drop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const from = sections.findIndex((x) => x.id === dragId);
    const to = sections.findIndex((x) => x.id === targetId);
    const next = [...sections];
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    setSections(next);
    setDragId(null);
  };

  const select = (id: string, from: "list" | "preview") => {
    setSelected(id);
    setTab("page");
    const target = from === "list" ? previewRef.current?.querySelector(`[data-sid="${id}"]`) : document.getElementById(`row-${id}`);
    window.setTimeout(() => target?.scrollIntoView({ behavior: "smooth", block: from === "list" ? "nearest" : "start" }), 50);
  };

  const save = async () => {
    setSaving(true);
    try {
      await adminSend("/api/admin/homepage", "PUT", layout);
      toast.success("Published", { description: "The live store now uses this layout." });
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handle = normaliseHandle(layout.instagramHandle);
  const previewData: HomeData = { ...data, instagramHandle: handle };
  const editorCtx: EditorContext = { ...ctx, banners };
  const setFooter = (p: Partial<FooterConfig>) => setLayout((l) => ({ ...l, footer: { ...l.footer, ...p } }));
  const nav = layout.bottomNav;
  const setNav = (items: BottomNavItem[], enabled = nav.enabled) => setLayout((l) => ({ ...l, bottomNav: { enabled, items } }));
  const moveNav = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= nav.items.length) return;
    const next = [...nav.items];
    [next[i], next[j]] = [next[j], next[i]];
    setNav(next);
  };
  const blockLinks = (e: React.MouseEvent) => { if ((e.target as HTMLElement).closest("a")) e.preventDefault(); };

  return (
    <div className="flex flex-col gap-5 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-sky-950">Homepage builder</h1>
          <p className="text-sm text-sky-950/70">Add, reorder and style every block of your homepage, plus the footer and social buttons. Click any block in the preview to edit it.</p>
        </div>
        <Button asChild variant="outline"><a href="/" target="_blank" rel="noopener noreferrer"><ExternalLink /> View store</a></Button>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[440px_minmax(0,1fr)]">
        {/* ── editor column ── */}
        <div className="flex min-w-0 flex-col gap-4">
          <div role="tablist" aria-label="Builder sections" className="glass-strong grid grid-cols-3 gap-1 rounded-2xl p-1">
            {([["page", "Page sections"], ["footer", "Footer"], ["social", "Mobile & social"]] as const).map(([k, label]) => (
              <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
                className={cn("rounded-xl px-2 py-2 text-xs font-semibold transition sm:text-sm", tab === k ? "bg-sky-900 text-white shadow" : "text-sky-950/75 hover:bg-white/70")}>
                {label}
              </button>
            ))}
          </div>

          {tab === "page" && (
            <>
              <ol className="flex flex-col gap-2" aria-label="Homepage sections, top to bottom">
                {sections.map((s, i) => {
                  const Icon = ICON[s.type];
                  const open = selected === s.id;
                  return (
                    <li key={s.id} id={`row-${s.id}`}
                      draggable
                      onDragStart={() => setDragId(s.id)}
                      onDragOver={(e) => { e.preventDefault(); }}
                      onDrop={() => drop(s.id)}
                      onDragEnd={() => setDragId(null)}
                      className={cn("glass-strong scroll-mt-24 overflow-hidden rounded-2xl text-sky-950 transition", open && "ring-2 ring-sky-600", dragId === s.id && "opacity-50", !s.enabled && "opacity-70")}>
                      <div className="flex items-center gap-2 p-2.5">
                        <GripVertical className="size-4 shrink-0 cursor-grab text-sky-950/40" aria-hidden />
                        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-sky-100 text-sky-800"><Icon className="size-4" aria-hidden /></span>
                        <button type="button" onClick={() => (open ? setSelected(null) : select(s.id, "list"))} aria-expanded={open} className="min-w-0 flex-1 text-left">
                          <span className="block truncate text-sm font-semibold">{i + 1}. {SECTION_META[s.type].label}</span>
                          <span className="block truncate text-[11px] text-sky-950/60">{summary(s)}</span>
                        </button>
                        <div className="flex shrink-0 items-center">
                          <Button type="button" variant="ghost" size="icon-sm" onClick={() => update({ ...s, enabled: !s.enabled } as HomeSection)} aria-label={s.enabled ? "Hide section" : "Show section"} title={s.enabled ? "Hide" : "Show"}>
                            {s.enabled ? <Eye /> : <EyeOff />}
                          </Button>
                          <Button type="button" variant="ghost" size="icon-sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"><ArrowUp /></Button>
                          <Button type="button" variant="ghost" size="icon-sm" onClick={() => move(i, 1)} disabled={i === sections.length - 1} aria-label="Move down"><ArrowDown /></Button>
                        </div>
                      </div>
                      {open && (
                        <div className="border-t border-sky-950/10 bg-white/30 p-3">
                          <SectionEditor section={s} onChange={update} ctx={editorCtx} />
                          <div className="mt-4 flex justify-between border-t border-sky-950/10 pt-3">
                            <Button type="button" variant="ghost" size="sm" onClick={() => duplicate(s)}><Copy /> Duplicate</Button>
                            <Button type="button" variant="ghost" size="sm" className="text-red-700" onClick={() => remove(s)}><Trash2 /> Remove</Button>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
              {sections.length === 0 && <p className="rounded-2xl border border-dashed border-sky-900/20 p-6 text-center text-sm text-sky-950/70">The homepage is empty. Add a section.</p>}
              <Button type="button" className="btn-glass" onClick={() => setAdding(true)}>
                <Plus /> Add section {selected ? "below selected" : "at the end"}
              </Button>
            </>
          )}

          {tab === "footer" && (
            <AdminCard>
              <AdminCardHeader><AdminCardTitle>Footer</AdminCardTitle>
                <Button type="button" variant="ghost" size="sm" onClick={() => setFooter(structuredClone(DEFAULT_FOOTER))}><RotateCcw /> Reset</Button>
              </AdminCardHeader>
              <AdminCardContent className="grid gap-4">
                <div>
                  <label htmlFor="ft-tag" className="mb-1.5 block text-xs font-medium">About text</label>
                  <textarea id="ft-tag" rows={3} maxLength={240} value={layout.footer.tagline} onChange={(e) => setFooter({ tagline: e.target.value })}
                    className="w-full rounded-md border border-input bg-white/70 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40" />
                </div>
                <ToggleField label="Trust strip on top of footer" checked={layout.footer.showFeatures} onChange={(v) => setFooter({ showFeatures: v })} />
                {layout.footer.showFeatures && <FeatureItemsEditor items={layout.footer.features} onChange={(features) => setFooter({ features })} max={4} />}
                <div className="grid gap-3">
                  <p className="text-sm font-semibold">Link columns ({layout.footer.columns.length}/4)</p>
                  {layout.footer.columns.map((col, ci) => (
                    <div key={ci} className="grid gap-2 rounded-xl border border-sky-900/10 bg-white/50 p-3">
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <TextField label="Column title" value={col.title} max={30}
                            onChange={(v) => setFooter({ columns: layout.footer.columns.map((c, j) => (j === ci ? { ...c, title: v } : c)) })} />
                        </div>
                        <Button type="button" variant="ghost" size="icon-sm" className="text-red-700" aria-label="Remove column"
                          onClick={() => setFooter({ columns: layout.footer.columns.filter((_, j) => j !== ci) })}><Trash2 /></Button>
                      </div>
                      {col.links.map((l, li) => {
                        const setLink = (p: Partial<typeof l>) => setFooter({ columns: layout.footer.columns.map((c, j) => (j === ci ? { ...c, links: c.links.map((x, k) => (k === li ? { ...x, ...p } : x)) } : c)) });
                        return (
                          <div key={li} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                            <Input value={l.label} maxLength={40} onChange={(e) => setLink({ label: e.target.value })} placeholder="Label" aria-label="Link label" className="h-8 text-xs" />
                            <Input value={l.href} maxLength={200} onChange={(e) => setLink({ href: e.target.value })} placeholder="/shop/jeans" aria-label="Link path" className="h-8 text-xs" list="ft-dest" />
                            <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove link"
                              onClick={() => setFooter({ columns: layout.footer.columns.map((c, j) => (j === ci ? { ...c, links: c.links.filter((_, k) => k !== li) } : c)) })}><Trash2 /></Button>
                          </div>
                        );
                      })}
                      <Button type="button" variant="outline" size="sm" className="w-fit" disabled={col.links.length >= 8}
                        onClick={() => setFooter({ columns: layout.footer.columns.map((c, j) => (j === ci ? { ...c, links: [...c.links, { label: "", href: "" }] } : c)) })}><Plus /> Add link</Button>
                    </div>
                  ))}
                  <datalist id="ft-dest">
                    {ctx.destinations.map((d) => <option key={d.href} value={d.href}>{d.label}</option>)}
                    <option value="/combos">Combos</option><option value="/orders">Orders</option><option value="/account">Account</option><option value="/wishlist">Wishlist</option>
                  </datalist>
                  <Button type="button" variant="outline" size="sm" className="w-fit" disabled={layout.footer.columns.length >= 4}
                    onClick={() => setFooter({ columns: [...layout.footer.columns, { title: "New column", links: [] }] })}><Plus /> Add column</Button>
                </div>
                <ToggleField label="Payment badges (UPI, Cards, COD)" hint="Shown only for methods that are actually switched on." checked={layout.footer.showPayments} onChange={(v) => setFooter({ showPayments: v })} />
                <TextField label="Copyright line" value={layout.footer.copyright} max={80} onChange={(v) => setFooter({ copyright: v })} placeholder={`© ${new Date().getFullYear()} ${footerStore.storeName}. All rights reserved.`} />
              </AdminCardContent>
            </AdminCard>
          )}

          {tab === "social" && (
            <>
            <AdminCard>
              <AdminCardHeader><AdminCardTitle>Phone bottom bar (app style)</AdminCardTitle></AdminCardHeader>
              <AdminCardContent className="grid gap-3">
                <ToggleField label="Show bottom bar on phones" hint="Hidden on product, combo and checkout pages, which have their own buy bar."
                  checked={nav.enabled} onChange={(v) => { setNav(nav.items, v); if (v) setDevice("mobile"); }} />
                {nav.enabled && (
                  <>
                    <ol className="grid gap-1" aria-label="Buttons, left to right">
                      {nav.items.map((k, i) => {
                        const M = BOTTOM_NAV_META[k];
                        return (
                          <li key={k} className="flex items-center gap-2 rounded-lg bg-white/70 px-2 py-1 text-sm">
                            <M.icon className="size-4 text-sky-800" aria-hidden />
                            <span className="flex-1">{M.label}</span>
                            <Button type="button" variant="ghost" size="icon-sm" onClick={() => moveNav(i, -1)} disabled={i === 0} aria-label={`Move ${M.label} left`}><ArrowUp /></Button>
                            <Button type="button" variant="ghost" size="icon-sm" onClick={() => moveNav(i, 1)} disabled={i === nav.items.length - 1} aria-label={`Move ${M.label} right`}><ArrowDown /></Button>
                            <Button type="button" variant="ghost" size="icon-sm" onClick={() => setNav(nav.items.filter((x) => x !== k))} disabled={nav.items.length <= 3} aria-label={`Remove ${M.label}`}><Trash2 /></Button>
                          </li>
                        );
                      })}
                    </ol>
                    <div className="flex flex-wrap gap-1.5">
                      {BOTTOM_NAV_ITEMS.filter((k) => !nav.items.includes(k)).map((k) => (
                        <button key={k} type="button" disabled={nav.items.length >= 5} onClick={() => setNav([...nav.items, k])}
                          className="rounded-full border border-sky-900/15 bg-white px-2.5 py-1 text-xs hover:border-sky-600 disabled:opacity-40">+ {BOTTOM_NAV_META[k].label}</button>
                      ))}
                    </div>
                    <p className="text-[11px] text-sky-950/60">3 to 5 buttons. Bag and Wishlist show live counts.</p>
                  </>
                )}
              </AdminCardContent>
            </AdminCard>
            <AdminCard>
              <AdminCardHeader><AdminCardTitle>Social links &amp; floating buttons</AdminCardTitle></AdminCardHeader>
              <AdminCardContent className="grid gap-4">
                <div>
                  <TextField label="Instagram username" value={layout.instagramHandle} max={80} placeholder="melamart" onChange={(v) => setLayout((l) => ({ ...l, instagramHandle: v }))}
                    hint={layout.instagramHandle && !handle ? "Letters, numbers, dots and underscores only." : "Used for @username, Follow links, the footer and the Instagram button."} />
                </div>
                <TextField label="Facebook page (optional)" value={layout.social.facebook} max={200} placeholder="https://www.facebook.com/yourpage" onChange={(v) => setLayout((l) => ({ ...l, social: { ...l.social, facebook: v } }))} />
                <TextField label="YouTube channel (optional)" value={layout.social.youtube} max={200} placeholder="https://www.youtube.com/@yourchannel" onChange={(v) => setLayout((l) => ({ ...l, social: { ...l.social, youtube: v } }))} />
                <div className="grid gap-3 rounded-xl border border-sky-900/10 bg-white/40 p-3">
                  <ToggleField label="Floating WhatsApp button" checked={layout.floating.whatsapp} onChange={(v) => setLayout((l) => ({ ...l, floating: { ...l.floating, whatsapp: v } }))}
                    hint={phone.replace(/\D/g, "").length >= 10 ? `Opens a chat with ${phone}` : "Add your WhatsApp number in Settings first."} />
                  {phone.replace(/\D/g, "").length < 10 && <Link href="/admin/settings" className="text-xs font-medium text-sky-800 underline">Add WhatsApp number in Settings →</Link>}
                  {layout.floating.whatsapp && (
                    <TextField label="Pre-filled message" value={layout.floating.whatsappMessage} max={120} placeholder={`Hi ${footerStore.storeName}, I have a question.`}
                      onChange={(v) => setLayout((l) => ({ ...l, floating: { ...l.floating, whatsappMessage: v } }))} />
                  )}
                  <ToggleField label="Floating Instagram button" checked={layout.floating.instagram} onChange={(v) => setLayout((l) => ({ ...l, floating: { ...l.floating, instagram: v } }))}
                    hint={handle ? `Opens instagram.com/${handle}` : "Add your Instagram username above first."} />
                </div>
              </AdminCardContent>
            </AdminCard>
            </>
          )}
        </div>

        {/* ── live preview ── */}
        <div className="glass-strong min-w-0 rounded-2xl p-3 xl:sticky xl:top-24">
          <div className="mb-3 flex items-center justify-between gap-3 px-1">
            <p className="text-sm font-semibold text-sky-950">Live preview {dirty && <span className="ml-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">Unsaved</span>}</p>
            <div role="radiogroup" aria-label="Preview device" className="inline-flex gap-1 rounded-xl border border-sky-900/10 bg-white/50 p-1">
              {([["desktop", Monitor, "Desktop"], ["mobile", Smartphone, "Mobile"]] as const).map(([k, Icon, label]) => (
                <button key={k} type="button" role="radio" aria-checked={device === k} onClick={() => setDevice(k)}
                  className={cn("inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium", device === k ? "bg-sky-900 text-white" : "text-sky-950/75 hover:bg-white")}>
                  <Icon className="size-3.5" aria-hidden /> {label}
                </button>
              ))}
            </div>
          </div>
          <div onClickCapture={blockLinks}
            className={cn("relative mx-auto overflow-hidden bg-background text-foreground shadow-xl shadow-sky-950/10 transition-[max-width]",
              device === "mobile" ? "max-w-[390px] rounded-[2rem] border-8 border-neutral-900" : "rounded-xl border border-sky-900/10")}>
            <div ref={previewRef} className="max-h-[calc(100vh-11rem)] min-h-[480px] overflow-y-auto">
              {sections.filter((s) => s.enabled).map((s) => (
                <div key={s.id} data-sid={s.id} onClick={() => select(s.id, "preview")}
                  className={cn("relative cursor-pointer outline-offset-[-3px] transition hover:outline hover:outline-2 hover:outline-sky-400/70", selected === s.id && "outline outline-2 outline-sky-600")}>
                  {selected === s.id && <span className="absolute left-2 top-2 z-30 rounded-md bg-sky-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">{SECTION_META[s.type].label}</span>}
                  <RenderSection section={s} data={previewData} preview />
                </div>
              ))}
              <div onClick={() => setTab("footer")} className={cn("cursor-pointer hover:outline hover:outline-2 hover:outline-sky-400/70", tab === "footer" && "outline outline-2 outline-sky-600")}>
                <Footer config={layout.footer} store={{ ...footerStore, instagramHandle: handle, facebook: layout.social.facebook, youtube: layout.social.youtube }} />
              </div>
            </div>
            {device === "mobile" && nav.enabled && <div className="pointer-events-none"><BottomNav items={nav.items} preview /></div>}
            {(layout.floating.whatsapp || (layout.floating.instagram && handle)) && (
              <div className={cn("pointer-events-none absolute right-4 flex flex-col gap-2", device === "mobile" && nav.enabled ? "bottom-[4.5rem]" : "bottom-4")}>
                {layout.floating.instagram && handle && <span className="grid size-10 place-items-center rounded-full bg-[radial-gradient(circle_at_30%_110%,#fdf497_0%,#fd5949_45%,#d6249f_60%,#285AEB_90%)] text-white shadow-lg"><InstagramIcon className="size-5" /></span>}
                {layout.floating.whatsapp && <span className="grid size-10 place-items-center rounded-full bg-[#25D366] text-[10px] font-bold text-white shadow-lg">WA</span>}
              </div>
            )}
          </div>
          <p className="mt-2 text-center text-[11px] text-sky-950/60">Hidden sections aren’t shown. Links are disabled in the preview.</p>
        </div>
      </div>

      {/* add section */}
      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="glass-dialog max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add a section</DialogTitle>
            <DialogDescription>It’s added {selected ? "below the selected section" : "at the end"}. You can drag it anywhere afterwards.</DialogDescription>
          </DialogHeader>
          <ul className="grid gap-2 sm:grid-cols-2">
            {SECTION_TYPES.map((t) => {
              const Icon = ICON[t];
              return (
                <li key={t}>
                  <button type="button" onClick={() => add(t)} className="flex w-full items-start gap-3 rounded-xl border border-sky-900/10 bg-white/60 p-3 text-left transition hover:border-sky-500 hover:bg-white">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-sky-100 text-sky-800"><Icon className="size-4" aria-hidden /></span>
                    <span>
                      <span className="block text-sm font-semibold text-sky-950">{SECTION_META[t].label}</span>
                      <span className="block text-xs text-sky-950/65">{SECTION_META[t].description}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </DialogContent>
      </Dialog>

      {/* save bar */}
      <div className={cn("glass-strong fixed inset-x-0 bottom-4 z-30 mx-auto flex w-fit items-center gap-3 rounded-full px-4 py-2 shadow-lg transition-all",
        dirty ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0")} aria-hidden={!dirty}>
        <span className="text-sm text-sky-950">Unsaved changes</span>
        <Button size="sm" variant="ghost" onClick={() => setLayout(saved)} disabled={saving} tabIndex={dirty ? 0 : -1}>Discard</Button>
        <Button size="sm" className="btn-glass" onClick={save} disabled={saving} tabIndex={dirty ? 0 : -1}><Save /> {saving ? "Publishing…" : "Save & publish"}</Button>
      </div>
    </div>
  );
}
