"use client";

import * as React from "react";
import Image from "next/image";
import { ImageIcon, Link2, Upload, X } from "lucide-react";
import { UploadDialog } from "@/components/admin/upload-dialog";
import { useMediaConfig } from "@/components/admin/media-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IMAGE_URL_MESSAGE, isAllowedImageUrl } from "@/lib/catalog-constants";
import { cn } from "@/lib/utils";

/** One image: upload (WebP-compressed) or paste a URL, with a live preview. */
export function SingleImageField({
  id,
  value,
  onChange,
  aspect = "aspect-square",
  hint,
  required = false,
}: {
  id: string;
  value: string;
  onChange: (url: string) => void;
  /** Tailwind aspect class for the preview box. */
  aspect?: string;
  hint?: string;
  required?: boolean;
}) {
  const media = useMediaConfig();
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [pasting, setPasting] = React.useState(false);
  const trimmed = value.trim();
  const valid = trimmed !== "" && isAllowedImageUrl(trimmed);

  return (
    <div className="space-y-2">
      <div className={cn("relative w-full overflow-hidden rounded-xl border border-sky-900/10 bg-white/60", aspect)}>
        {valid ? (
          <>
            <Image src={trimmed} alt="" fill sizes="480px" className="object-cover" />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onChange("")}
              aria-label="Remove image"
              className="absolute right-1.5 top-1.5 bg-white/85 hover:bg-white"
            >
              <X />
            </Button>
          </>
        ) : (
          <div className="absolute inset-0 grid place-items-center text-sky-950/50">
            <div className="flex flex-col items-center gap-1 text-xs">
              <ImageIcon className="size-5" aria-hidden />
              {required ? "Image required" : "No image"}
            </div>
          </div>
        )}
      </div>
      {hint && <p className="text-[11px] text-sky-950/65">{hint}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" className="btn-glass" onClick={() => setUploadOpen(true)}>
          <Upload /> {valid ? "Replace" : "Upload"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setPasting((p) => !p)} aria-expanded={pasting} aria-controls={`${id}-url`}>
          <Link2 /> Paste URL
        </Button>
      </div>
      {pasting && (
        <div>
          <Input
            id={`${id}-url`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://res.cloudinary.com/…"
            aria-label="Image URL"
            aria-invalid={trimmed !== "" && !valid}
            className="h-9 text-xs"
          />
          {trimmed !== "" && !valid && <p className="mt-1 text-xs text-red-700">{IMAGE_URL_MESSAGE}</p>}
        </div>
      )}
      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        defaultProvider={media.defaultProvider}
        cloudinaryEnabled={media.cloudinaryEnabled}
        multiple={false}
        onUploaded={(imgs) => imgs[0] && onChange(imgs[0].url)}
      />
    </div>
  );
}
