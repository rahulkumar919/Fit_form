"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, Copy, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { AdminCard } from "@/components/admin/admin-card";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { UploadDialog } from "@/components/admin/upload-dialog";
import { useMediaConfig } from "@/components/admin/media-config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface MediaRow {
  id: string;
  name: string;
  url: string;
  thumb: string;
  provider: "server" | "cloudinary";
  width: number;
  height: number;
  sizeKb: number;
  originalSizeKb: number;
  alt: string;
  createdAt: string;
}

type Tab = "all" | "server" | "cloudinary";

export function MediaLibrary({ assets }: { assets: MediaRow[] }) {
  const router = useRouter();
  const media = useMediaConfig();
  const [tab, setTab] = React.useState<Tab>("all");
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [toDelete, setToDelete] = React.useState<MediaRow | null>(null);
  const [copied, setCopied] = React.useState<string | null>(null);

  const shown = assets.filter((a) => tab === "all" || a.provider === tab);
  const totalKb = assets.reduce((n, a) => n + a.sizeKb, 0);
  const savedKb = assets.reduce((n, a) => n + Math.max(0, a.originalSizeKb - a.sizeKb), 0);

  const copy = async (a: MediaRow) => {
    const full = a.url.startsWith("/") ? `${window.location.origin}${a.url}` : a.url;
    await navigator.clipboard.writeText(full).catch(() => undefined);
    setCopied(a.id);
    setTimeout(() => setCopied(null), 1500);
  };

  const remove = async () => {
    if (!toDelete) return;
    const res = await fetch(`/api/admin/media/${toDelete.id}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) {
      toast.error(json.message ?? "Could not delete the image");
      throw new Error("delete failed");
    }
    toast.success("Image deleted");
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-sky-950">Media library</h1>
          <p className="text-sm text-sky-950/70">
            {assets.length} images · {Math.round(totalKb)} KB at 800px · compression saved {Math.round(savedKb / 1024 * 10) / 10} MB
          </p>
        </div>
        <Button className="btn-glass" onClick={() => setUploadOpen(true)}><Upload /> Upload images</Button>
      </div>

      <div className="flex gap-1" role="group" aria-label="Filter by storage">
        {(["all", "server", "cloudinary"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} aria-pressed={tab === t}
            className={cn("rounded-full px-4 py-1.5 text-sm font-medium capitalize", tab === t ? "glass-pill-active" : "glass-icon text-sky-950/75")}>
            {t} ({t === "all" ? assets.length : assets.filter((a) => a.provider === t).length})
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <AdminCard className="p-10 text-center text-sm text-sky-950/70">
          No images yet. Upload product photos here or straight from the product form.
        </AdminCard>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {shown.map((a) => (
            <AdminCard key={a.id} className="group">
              <div className="relative aspect-square bg-white/60">
                <Image src={a.thumb} alt={a.alt || a.name} fill sizes="200px" className="object-cover" />
              </div>
              <div className="space-y-1 p-2">
                <p className="truncate text-[11px] font-medium text-sky-950" title={a.name}>{a.name}</p>
                <div className="flex items-center justify-between">
                  <Badge variant={a.provider === "cloudinary" ? "admin" : "secondary"} className="text-[9px]">{a.provider}</Badge>
                  <span className="text-[10px] text-sky-950/65">{a.width}×{a.height} · {a.sizeKb} KB</span>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-7 flex-1 text-xs" onClick={() => copy(a)}>
                    {copied === a.id ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} URL
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-red-700" aria-label={`Delete ${a.name}`} onClick={() => setToDelete(a)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        defaultProvider={media.defaultProvider}
        cloudinaryEnabled={media.cloudinaryEnabled}
        onUploaded={() => router.refresh()}
      />
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title="Delete this image?"
        description="All sizes are removed from storage. Images still used by a product or combo cannot be deleted."
        onConfirm={remove}
      />
    </div>
  );
}
