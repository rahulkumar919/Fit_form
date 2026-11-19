"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ExternalLink, Film, Pencil, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { AdminSocialRow } from "@/services/homepage";
import type { ShopLinkOption } from "@/services/admin";
import { AdminCard, AdminCardContent } from "@/components/admin/admin-card";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { SingleImageField } from "@/components/admin/single-image-field";
import { VideoField } from "@/components/admin/video-field";
import { InstagramIcon } from "@/components/icons/instagram";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { adminSend } from "@/lib/admin-fetch";
import { parseInstagramUrl } from "@/lib/instagram";
import { cn } from "@/lib/utils";

interface Draft {
  id?: string;
  instagramUrl: string;
  image: string;
  video: string;
  caption: string;
  linkType: "none" | "combo" | "product";
  linkId: string;
  showInReels: boolean;
  showInGallery: boolean;
  isActive: boolean;
}

const EMPTY: Draft = {
  instagramUrl: "", image: "", video: "", caption: "", linkType: "none", linkId: "",
  showInReels: true, showInGallery: true, isActive: true,
};

export function SocialManager({
  posts, options, handle,
}: { posts: AdminSocialRow[]; options: { combos: ShopLinkOption[]; products: ShopLinkOption[] }; handle: string }) {
  const router = useRouter();
  const [rows, setRows] = React.useState(posts);
  const [prev, setPrev] = React.useState(posts);
  if (prev !== posts) { setPrev(posts); setRows(posts); }
  const [draft, setDraft] = React.useState<Draft | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [toDelete, setToDelete] = React.useState<AdminSocialRow | null>(null);

  const reelsCount = rows.filter((r) => r.isActive && r.showInReels).length;
  const galleryCount = rows.filter((r) => r.isActive && r.showInGallery).length;

  const toggle = async (r: AdminSocialRow, key: "isActive" | "showInReels" | "showInGallery", value: boolean) => {
    setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, [key]: value } : x)));
    try {
      await adminSend(`/api/admin/social/${r.id}`, "PATCH", { [key]: value });
      router.refresh();
    } catch (e) {
      setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, [key]: !value } : x)));
      toast.error((e as Error).message);
    }
  };

  const move = async (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    const before = rows;
    setRows(next);
    try {
      await adminSend("/api/admin/social/order", "PUT", { ids: next.map((r) => r.id) });
      router.refresh();
    } catch (e) {
      setRows(before);
      toast.error((e as Error).message);
    }
  };

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const body = { ...draft, id: undefined, instagramUrl: draft.instagramUrl.trim(), image: draft.image.trim(), linkId: draft.linkType === "none" ? "" : draft.linkId };
      if (draft.id) await adminSend(`/api/admin/social/${draft.id}`, "PATCH", body);
      else await adminSend("/api/admin/social", "POST", body);
      toast.success(draft.id ? "Saved" : "Added to the store");
      setDraft(null);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!toDelete) return;
    try {
      await adminSend(`/api/admin/social/${toDelete.id}`, "DELETE");
      toast.success("Removed");
      setToDelete(null);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
      throw e;
    }
  };

  const parsed = draft ? parseInstagramUrl(draft.instagramUrl) : null;
  const linkOptions = draft?.linkType === "combo" ? options.combos : draft?.linkType === "product" ? options.products : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-sky-950">Instagram &amp; reels</h1>
          <p className="text-sm text-sky-950/70">
            {reelsCount} in “Shop the Reel” · {galleryCount} in “Follow the looks”.{" "}
            {handle ? <>Profile: <strong>@{handle}</strong>. </> : <>Add your Instagram username in </>}
            <Link href="/admin/homepage" className="font-medium text-sky-800 underline-offset-2 hover:underline">Homepage settings →</Link>
          </p>
        </div>
        <Button className="btn-glass" onClick={() => setDraft({ ...EMPTY })}><Plus /> Add reel or post</Button>
      </div>

      {rows.length === 0 ? (
        <AdminCard>
          <AdminCardContent className="py-12 text-center text-sm text-sky-950/70">
            <InstagramIcon className="mx-auto mb-2 size-8 text-sky-900/40" />
            Nothing added yet. Paste a link to one of your Instagram reels to get started.
            <br />Until then the reel and gallery sections stay hidden on the homepage.
          </AdminCardContent>
        </AdminCard>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {rows.map((r, i) => (
            <li key={r.id} className={cn("glass-strong flex flex-col overflow-hidden rounded-2xl text-sky-950", !r.isActive && "opacity-60")}>
              <div className="relative aspect-[9/16] bg-sky-950/10">
                <Image src={r.image} alt="" fill sizes="240px" className="object-cover" />
                <div className="absolute left-2 top-2 flex gap-1">
                  <span className="rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">{r.kind === "reel" ? "Reel" : "Post"}</span>
                  {r.video && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/90 px-2 py-0.5 text-[10px] font-medium text-white"><Film className="size-3" aria-hidden /> Video</span>}
                </div>
                <a href={r.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Open on Instagram"
                  className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/70">
                  <ExternalLink className="size-3.5" />
                </a>
                {r.shop && (
                  <span className="absolute inset-x-2 bottom-2 flex items-center gap-1.5 truncate rounded-lg bg-white/90 px-2 py-1 text-[11px] font-medium">
                    <ShoppingBag className="size-3 shrink-0" aria-hidden /> <span className="truncate">{r.shop.name}</span>
                  </span>
                )}
                {r.linkType !== "none" && !r.shop && (
                  <span className="absolute inset-x-2 bottom-2 rounded-lg bg-amber-100 px-2 py-1 text-[11px] font-medium text-amber-900">Linked item is hidden</span>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-3 text-xs">
                <p className="line-clamp-2 min-h-8 font-medium">{r.caption || <span className="text-sky-950/50">No caption</span>}</p>
                {([["isActive", "Active"], ["showInReels", "Shop the Reel"], ["showInGallery", "Follow the looks"]] as const).map(([k, label]) => (
                  <label key={k} className="flex items-center justify-between gap-2">
                    <span>{label}</span>
                    <Switch checked={r[k]} onCheckedChange={(v) => toggle(r, k, v)} disabled={k !== "isActive" && !r.isActive} />
                  </label>
                ))}
                <div className="mt-1 flex items-center justify-between border-t border-sky-950/10 pt-2">
                  <div className="flex">
                    <Button variant="ghost" size="icon-sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move earlier"><ArrowLeft /></Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label="Move later"><ArrowRight /></Button>
                  </div>
                  <div className="flex">
                    <Button variant="ghost" size="icon-sm" aria-label="Edit"
                      onClick={() => setDraft({ id: r.id, instagramUrl: r.instagramUrl, image: r.image, video: r.video, caption: r.caption, linkType: r.linkType, linkId: r.linkId, showInReels: r.showInReels, showInGallery: r.showInGallery, isActive: r.isActive })}>
                      <Pencil />
                    </Button>
                    <Button variant="ghost" size="icon-sm" className="text-red-700" aria-label="Delete" onClick={() => setToDelete(r)}><Trash2 /></Button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!draft} onOpenChange={(v) => !v && !saving && setDraft(null)}>
        <DialogContent className="glass-dialog max-h-[92vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit Instagram item" : "Add reel or post"}</DialogTitle>
            <DialogDescription>Each item links to its own Instagram post. Upload the reel video to play it right on your homepage.</DialogDescription>
          </DialogHeader>
          {draft && (
            <div className="grid gap-5">
              <div>
                <Label htmlFor="sp-url" className="mb-1.5 block">Instagram link <span className="text-red-700">*</span></Label>
                <Input id="sp-url" value={draft.instagramUrl} onChange={(e) => setDraft((d) => d && ({ ...d, instagramUrl: e.target.value }))}
                  placeholder="https://www.instagram.com/reel/ABC123xyz/" aria-invalid={!!draft.instagramUrl && !parsed} />
                <p className={cn("mt-1 text-[11px]", draft.instagramUrl && !parsed ? "text-red-700" : "text-sky-950/65")}>
                  {draft.instagramUrl && !parsed
                    ? "That doesn't look like a reel or post link. Open the reel on Instagram → ⋯ → Copy link."
                    : parsed ? `${parsed.kind === "reel" ? "Reel" : "Post"} · ${parsed.code}` : "Open the reel on Instagram → ⋯ → Copy link."}
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-[200px_200px_1fr]">
                <div>
                  <Label className="mb-1.5 block">Cover image <span className="text-red-700">*</span></Label>
                  <SingleImageField id="sp-image" value={draft.image} onChange={(u) => setDraft((d) => d && ({ ...d, image: u }))} aspect="aspect-[9/16]" required
                    hint="A frame from the reel (1080 × 1920)." />
                </div>
                <div>
                  <Label htmlFor="sp-video" className="mb-1.5 block">Reel video</Label>
                  <VideoField id="sp-video" value={draft.video} poster={draft.image} onChange={(u) => setDraft((d) => d && ({ ...d, video: u }))} />
                </div>
                <div className="grid content-start gap-4">
                  <div>
                    <Label htmlFor="sp-caption" className="mb-1.5 block">Caption</Label>
                    <Input id="sp-caption" value={draft.caption} maxLength={120} onChange={(e) => setDraft((d) => d && ({ ...d, caption: e.target.value }))} placeholder="Weekend denim, styled 3 ways" />
                  </div>
                  <div>
                    <p className="mb-1.5 text-sm font-medium text-sky-950">Shop this look</p>
                    <div className="grid gap-2">
                      <Select value={draft.linkType} onValueChange={(v) => setDraft((d) => d && ({ ...d, linkType: v as Draft["linkType"], linkId: "" }))}>
                        <SelectTrigger aria-label="Link type"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No shop link</SelectItem>
                          <SelectItem value="combo">A combo</SelectItem>
                          <SelectItem value="product">A product</SelectItem>
                        </SelectContent>
                      </Select>
                      {draft.linkType !== "none" && (
                        <Select value={draft.linkId} onValueChange={(v) => setDraft((d) => d && ({ ...d, linkId: v }))}>
                          <SelectTrigger aria-label={`Choose ${draft.linkType}`}><SelectValue placeholder={`Choose a ${draft.linkType}`} /></SelectTrigger>
                          <SelectContent className="max-h-72">
                            {linkOptions.map((o) => (
                              <SelectItem key={o.id} value={o.id}>{o.name}{o.live ? "" : " (hidden)"}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                  <div className="grid gap-2 rounded-xl border border-sky-900/10 bg-white/40 p-3 text-sm">
                    {([["showInReels", "Show in “Shop the Reel”"], ["showInGallery", "Show in “Follow the looks”"], ["isActive", "Active"]] as const).map(([k, label]) => (
                      <label key={k} className="flex items-center justify-between gap-3">
                        <span>{label}</span>
                        <Switch checked={draft[k]} onCheckedChange={(v) => setDraft((d) => d && ({ ...d, [k]: v }))} />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)} disabled={saving}>Cancel</Button>
            <Button className="btn-glass" onClick={save} disabled={saving || !parsed || !draft?.image}>{saving ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title="Remove this item?"
        description="It disappears from the homepage. The uploaded video file is deleted too; the post stays on Instagram."
        onConfirm={remove}
      />
    </div>
  );
}
