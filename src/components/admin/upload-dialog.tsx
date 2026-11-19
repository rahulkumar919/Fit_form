"use client";

import * as React from "react";
import { Cloud, HardDrive, ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface UploadedImage { id: string; url: string; provider: string; sizeKb: number; originalSizeKb: number }

type Provider = "server" | "cloudinary";

/**
 * Asks "Where do you want to store this image?" on every upload,
 * pre-selecting the default from Settings. Supports several files at once.
 */
export function UploadDialog({
  open,
  onOpenChange,
  onUploaded,
  defaultProvider = "server",
  cloudinaryEnabled = false,
  multiple = true,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onUploaded: (images: UploadedImage[]) => void;
  defaultProvider?: Provider;
  cloudinaryEnabled?: boolean;
  multiple?: boolean;
}) {
  const [busy, setBusy] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={(v) => !busy && onOpenChange(v)}>
      <DialogContent className="glass-dialog max-w-md">
        {/* Form state lives inside the content, which unmounts on close, so every open starts fresh. */}
        <UploadForm
          busy={busy}
          setBusy={setBusy}
          onClose={() => onOpenChange(false)}
          onUploaded={onUploaded}
          initialProvider={cloudinaryEnabled ? defaultProvider : "server"}
          cloudinaryEnabled={cloudinaryEnabled}
          multiple={multiple}
        />
      </DialogContent>
    </Dialog>
  );
}

function UploadForm({
  busy, setBusy, onClose, onUploaded, initialProvider, cloudinaryEnabled, multiple,
}: {
  busy: boolean;
  setBusy: (v: boolean) => void;
  onClose: () => void;
  onUploaded: (images: UploadedImage[]) => void;
  initialProvider: Provider;
  cloudinaryEnabled: boolean;
  multiple: boolean;
}) {
  const [provider, setProvider] = React.useState<Provider>(initialProvider);
  const [files, setFiles] = React.useState<File[]>([]);
  const [alt, setAlt] = React.useState("");
  const [progress, setProgress] = React.useState(0);

  const upload = async () => {
    if (files.length === 0) return toast.error("Choose at least one image");
    setBusy(true);
    const done: UploadedImage[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const fd = new FormData();
        fd.append("file", files[i]);
        fd.append("provider", provider);
        fd.append("alt", alt);
        const res = await fetch("/api/admin/media", { method: "POST", body: fd });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.success) {
          toast.error(`${files[i].name}: ${json.message ?? "upload failed"}`);
          continue;
        }
        done.push(json.data);
        setProgress(i + 1);
      }
      if (done.length) {
        const saved = done.reduce((a, d) => a + (d.originalSizeKb - d.sizeKb), 0);
        toast.success(`${done.length} image${done.length > 1 ? "s" : ""} uploaded`, { description: `Compressed to WebP, saved about ${Math.max(0, Math.round(saved))} KB` });
        onUploaded(done);
        onClose();
      }
    } finally {
      setBusy(false);
    }
  };

  const options: { key: Provider; label: string; desc: string; icon: React.ElementType; disabled: boolean }[] = [
    { key: "server", label: "Server storage", desc: "Stored on your server", icon: HardDrive, disabled: false },
    { key: "cloudinary", label: "Cloudinary", desc: cloudinaryEnabled ? "Cloudinary CDN" : "Add Cloudinary keys to enable", icon: Cloud, disabled: !cloudinaryEnabled },
  ];

  return (
    <>
        <DialogHeader>
          <DialogTitle>Upload images</DialogTitle>
          <DialogDescription>Where do you want to store this image?</DialogDescription>
        </DialogHeader>

        <div role="radiogroup" aria-label="Storage provider" className="grid grid-cols-2 gap-3">
          {options.map((o) => (
            <button
              key={o.key}
              type="button"
              role="radio"
              aria-checked={provider === o.key}
              disabled={o.disabled}
              onClick={() => setProvider(o.key)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border-2 p-4 text-center transition disabled:cursor-not-allowed disabled:opacity-50",
                provider === o.key ? "border-sky-600 bg-sky-50" : "border-border hover:border-sky-300",
              )}
            >
              <o.icon className="size-6 text-sky-700" />
              <span className="text-sm font-semibold">{o.label}</span>
              <span className="text-[11px] text-muted-foreground">{o.desc}</span>
            </button>
          ))}
        </div>

        <div>
          <Label htmlFor="up-files" className="mb-1.5 block">Images</Label>
          <label htmlFor="up-files" className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-sky-300 bg-white/60 p-5 text-center text-sm text-sky-900 hover:bg-white">
            <ImagePlus className="size-6" />
            {files.length ? `${files.length} file${files.length > 1 ? "s" : ""} selected` : "Choose JPG, PNG, WebP or AVIF (max 8 MB each)"}
          </label>
          <input id="up-files" type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple={multiple} className="sr-only"
            onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 10))} />
        </div>
        <div>
          <Label htmlFor="up-alt" className="mb-1.5 block">Alt text (for SEO and screen readers)</Label>
          <Input id="up-alt" value={alt} maxLength={160} onChange={(e) => setAlt(e.target.value)} placeholder="Navy slim fit jeans, front view" />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button className="btn-glass" onClick={upload} disabled={busy || files.length === 0}>
            {busy ? <><Loader2 className="animate-spin" /> Uploading {progress}/{files.length}</> : "Upload"}
          </Button>
        </DialogFooter>
    </>
  );
}
