"use client";

import * as React from "react";
import Image from "next/image";
import { ImageIcon, Plus, Upload, X } from "lucide-react";
import { UploadDialog } from "@/components/admin/upload-dialog";
import { useMediaConfig } from "@/components/admin/media-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IMAGE_URL_MESSAGE, isAllowedImageUrl } from "@/lib/catalog-constants";

/**
 * Ordered list of image URLs with live previews. The first image is the main one.
 * (File upload + compression arrives with the image-storage phase.)
 */
export function ImageListEditor({
  value,
  onChange,
  max = 12,
  idPrefix,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
  idPrefix: string;
}) {
  const media = useMediaConfig();
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const update = (i: number, v: string) => onChange(value.map((x, idx) => (idx === i ? v : x)));
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {value.length === 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-sky-900/20 p-4 text-sm text-sky-950/70">
          <ImageIcon className="size-4" /> No images yet.
        </div>
      )}
      {value.map((url, i) => {
        const trimmed = url.trim();
        const valid = trimmed !== "" && isAllowedImageUrl(trimmed);
        return (
          <div key={i} className="flex items-start gap-2">
            <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-sky-900/10 bg-white/60">
              {valid && <Image src={trimmed} alt="" fill sizes="48px" className="object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <Input
                id={`${idPrefix}-${i}`}
                value={url}
                onChange={(e) => update(i, e.target.value)}
                placeholder="https://images.unsplash.com/…"
                aria-label={`Image ${i + 1} URL${i === 0 ? " (main image)" : ""}`}
                aria-invalid={trimmed !== "" && !valid}
                className="h-9 text-xs"
              />
              {trimmed !== "" && !valid && <p className="mt-1 text-xs text-red-700">{IMAGE_URL_MESSAGE}</p>}
              {i === 0 && valid && <p className="mt-1 text-[11px] text-sky-950/65">Main image</p>}
            </div>
            <div className="flex shrink-0 items-center">
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">↑</Button>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => move(i, 1)} disabled={i === value.length - 1} aria-label="Move down">↓</Button>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => remove(i)} aria-label="Remove image"><X /></Button>
            </div>
          </div>
        );
      })}
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" className="btn-glass" onClick={() => setUploadOpen(true)} disabled={value.length >= max}>
          <Upload /> Upload
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...value, ""])} disabled={value.length >= max}>
          <Plus /> Paste URL
        </Button>
      </div>
      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        defaultProvider={media.defaultProvider}
        cloudinaryEnabled={media.cloudinaryEnabled}
        onUploaded={(imgs) => onChange([...value.filter((v) => v.trim() !== ""), ...imgs.map((i) => i.url)].slice(0, max))}
      />
    </div>
  );
}
