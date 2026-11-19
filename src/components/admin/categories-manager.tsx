"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ExternalLink, Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { CategoryRow } from "@/services/admin";
import { AdminCard } from "@/components/admin/admin-card";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { SingleImageField } from "@/components/admin/single-image-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { categoryHref, isAllowedImageUrl } from "@/lib/catalog-constants";
import { slugify } from "@/lib/utils";
import { adminSend } from "@/lib/admin-fetch";

interface Draft {
  id?: string;
  name: string;
  slug: string;
  slugTouched: boolean;
  description: string;
  image: string;
  isActive: boolean;
  showOnHome: boolean;
  showInNav: boolean;
  isSystem: boolean;
  productCount: number;
}

const EMPTY: Draft = {
  name: "", slug: "", slugTouched: false, description: "", image: "",
  isActive: true, showOnHome: true, showInNav: true, isSystem: false, productCount: 0,
};

type Toggle = "isActive" | "showOnHome" | "showInNav";

export function CategoriesManager({ rows: initial }: { rows: CategoryRow[] }) {
  const router = useRouter();
  const [rows, setRows] = React.useState(initial);
  const [draft, setDraft] = React.useState<Draft | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [toDelete, setToDelete] = React.useState<CategoryRow | null>(null);

  // Keep local (optimistic) rows in sync when the server data refreshes.
  const [prevInitial, setPrevInitial] = React.useState(initial);
  if (prevInitial !== initial) {
    setPrevInitial(initial);
    setRows(initial);
  }

  const homeCount = rows.filter((r) => r.isActive && r.showOnHome).length;

  const toggle = async (row: CategoryRow, key: Toggle, value: boolean) => {
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, [key]: value } : r)));
    try {
      await adminSend(`/api/admin/categories/${row.id}`, "PATCH", { [key]: value });
      router.refresh();
    } catch (e) {
      setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, [key]: !value } : r)));
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
      await adminSend("/api/admin/categories/order", "PUT", { ids: next.map((r) => r.id) });
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
      const body = {
        name: draft.name, slug: draft.slug, description: draft.description, image: draft.image.trim(),
        isActive: draft.isActive, showOnHome: draft.showOnHome, showInNav: draft.showInNav,
      };
      if (draft.id) await adminSend(`/api/admin/categories/${draft.id}`, "PATCH", body);
      else await adminSend("/api/admin/categories", "POST", body);
      toast.success(draft.id ? "Category updated" : "Category created");
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
      await adminSend(`/api/admin/categories/${toDelete.id}`, "DELETE");
      toast.success(`Deleted "${toDelete.name}"`);
      setToDelete(null);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
      throw e;
    }
  };

  const slugLocked = !!draft?.id && (draft.isSystem || draft.productCount > 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-sky-950">Categories</h1>
          <p className="text-sm text-sky-950/70">
            Order here controls the header menu and the homepage. {homeCount} shown on the homepage.{" "}
            <Link href="/admin/homepage" className="font-medium text-sky-800 underline-offset-2 hover:underline">Homepage layout →</Link>
          </p>
        </div>
        <Button className="btn-glass" onClick={() => setDraft({ ...EMPTY })}>
          <Plus /> New category
        </Button>
      </div>

      <AdminCard>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Order</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Products</TableHead>
                <TableHead className="text-center">Active</TableHead>
                <TableHead className="text-center">Homepage</TableHead>
                <TableHead className="text-center">Menu</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-sm text-sky-950/70">
                    No categories yet. Create your first one.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((r, i) => (
                <TableRow key={r.id} className={r.isActive ? "" : "opacity-60"}>
                  <TableCell>
                    <div className="flex items-center">
                      <Button variant="ghost" size="icon-sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${r.name} up`}><ArrowUp /></Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label={`Move ${r.name} down`}><ArrowDown /></Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative size-11 shrink-0 overflow-hidden rounded-lg border border-sky-900/10 bg-white/60">
                        {r.image && isAllowedImageUrl(r.image) ? (
                          <Image src={r.image} alt="" fill sizes="44px" className="object-cover" />
                        ) : (
                          <span aria-hidden className="grid h-full place-items-center text-sm font-semibold text-sky-950/40">{r.name.slice(0, 1)}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 font-medium text-sky-950">
                          {r.name}
                          {r.isSystem && (
                            <Badge variant="admin" className="gap-1 text-[10px]" title="Built-in collection: computed automatically">
                              <Lock className="size-2.5" aria-hidden /> Built-in
                            </Badge>
                          )}
                        </p>
                        <a href={categoryHref(r.slug)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-sky-950/60 hover:text-sky-800">
                          {categoryHref(r.slug)} <ExternalLink className="size-3" aria-hidden />
                        </a>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{r.productCount}</TableCell>
                  <TableCell className="text-center">
                    <Switch checked={r.isActive} onCheckedChange={(v) => toggle(r, "isActive", v)} aria-label={`${r.name} active`} />
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch checked={r.showOnHome} disabled={!r.isActive} onCheckedChange={(v) => toggle(r, "showOnHome", v)} aria-label={`Show ${r.name} on homepage`} />
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch checked={r.showInNav} disabled={!r.isActive} onCheckedChange={(v) => toggle(r, "showInNav", v)} aria-label={`Show ${r.name} in menu`} />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" aria-label={`Edit ${r.name}`}
                        onClick={() => setDraft({ ...r, slugTouched: true })}>
                        <Pencil />
                      </Button>
                      {!r.isSystem && (
                        <Button variant="ghost" size="icon-sm" className="text-red-700" aria-label={`Delete ${r.name}`} onClick={() => setToDelete(r)}>
                          <Trash2 />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </AdminCard>

      <Dialog open={!!draft} onOpenChange={(v) => !v && !saving && setDraft(null)}>
        <DialogContent className="glass-dialog max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit category" : "New category"}</DialogTitle>
            <DialogDescription>
              {draft?.isSystem ? "Built-in collection: you can rename it and change its image." : "Products can be filed under this category from the product form."}
            </DialogDescription>
          </DialogHeader>
          {draft && (
            <div className="grid gap-5 sm:grid-cols-[1fr_200px]">
              <div className="grid content-start gap-4">
                <div>
                  <Label htmlFor="cat-name" className="mb-1.5 block">Name</Label>
                  <Input id="cat-name" value={draft.name} maxLength={40} onChange={(e) => {
                    const name = e.target.value;
                    setDraft((d) => d && ({ ...d, name, slug: d.slugTouched || slugLocked ? d.slug : slugify(name) }));
                  }} placeholder="Kurtas" />
                </div>
                <div>
                  <Label htmlFor="cat-slug" className="mb-1.5 block">URL</Label>
                  <div className="flex items-center rounded-md border border-input bg-white/70 pl-3 text-sm text-sky-950/60 focus-within:ring-2 focus-within:ring-ring/40">
                    /shop/
                    <input id="cat-slug" value={draft.slug} disabled={slugLocked} maxLength={40}
                      onChange={(e) => setDraft((d) => d && ({ ...d, slug: slugify(e.target.value), slugTouched: true }))}
                      className="h-9 min-w-0 flex-1 bg-transparent pr-3 text-sky-950 outline-none disabled:opacity-60" />
                  </div>
                  {slugLocked && (
                    <p className="mt-1 text-[11px] text-sky-950/65">
                      {draft.isSystem ? "Built-in collections keep their URL." : "URL is locked because products use this category (keeps links and SEO working)."}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="cat-desc" className="mb-1.5 block">Description</Label>
                  <textarea id="cat-desc" rows={3} maxLength={240} value={draft.description}
                    onChange={(e) => setDraft((d) => d && ({ ...d, description: e.target.value }))}
                    className="w-full rounded-md border border-input bg-white/70 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                    placeholder="Shown at the top of the category page and in search results." />
                </div>
                <div className="grid gap-2 rounded-xl border border-sky-900/10 bg-white/40 p-3">
                  {([
                    ["isActive", "Active", "Hidden categories return 404 and disappear everywhere."],
                    ["showOnHome", "Show on homepage", "Appears in the “Shop by category” section."],
                    ["showInNav", "Show in menu", "Appears in the header menu."],
                  ] as const).map(([key, label, help]) => (
                    <div key={key} className="flex items-center justify-between gap-3">
                      <div>
                        <Label htmlFor={`cat-${key}`}>{label}</Label>
                        <p className="text-[11px] text-sky-950/60">{help}</p>
                      </div>
                      <Switch id={`cat-${key}`} checked={draft[key]} onCheckedChange={(v) => setDraft((d) => d && ({ ...d, [key]: v }))} />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label className="mb-1.5 block">Image</Label>
                <SingleImageField id="cat-image" value={draft.image} onChange={(url) => setDraft((d) => d && ({ ...d, image: url }))}
                  hint="Square works best (800 × 800). Used for homepage tiles." />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)} disabled={saving}>Cancel</Button>
            <Button className="btn-glass" onClick={save} disabled={saving || !draft?.name.trim() || !draft?.slug}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title={`Delete "${toDelete?.name}"?`}
        description={toDelete?.productCount ? `${toDelete.productCount} product(s) are in this category. Move them first.` : "This can't be undone."}
        onConfirm={remove}
      />
    </div>
  );
}
