"use client";

import * as React from "react";
import { Film, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useMediaConfig } from "@/components/admin/media-config";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_MB = 60;

/** Upload one reel video (MP4/WebM, ≤60 MB) with progress; stores to server or Cloudinary. */
export function VideoField({
  id, value, onChange, poster,
}: { id: string; value: string; onChange: (url: string) => void; poster?: string }) {
  const media = useMediaConfig();
  const [provider, setProvider] = React.useState<"server" | "cloudinary">(media.cloudinaryEnabled ? media.defaultProvider : "server");
  const [progress, setProgress] = React.useState<number | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const upload = (file: File) => {
    if (file.size > MAX_MB * 1024 * 1024) return toast.error(`Videos must be ${MAX_MB} MB or smaller`);
    if (!/^video\/(mp4|webm|quicktime)$/.test(file.type)) return toast.error("Upload an MP4 or WebM video");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("provider", provider);
    // XHR (not fetch) so we can show real upload progress for large files.
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/media/video");
    xhr.upload.onprogress = (e) => e.lengthComputable && setProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      setProgress(null);
      let json: { success?: boolean; message?: string; data?: { url: string; sizeMb: number } } = {};
      try { json = JSON.parse(xhr.responseText); } catch { /* ignore */ }
      if (xhr.status >= 200 && xhr.status < 300 && json.success && json.data) {
        onChange(json.data.url);
        toast.success(`Video uploaded (${json.data.sizeMb} MB)`);
      } else {
        toast.error(json.message ?? "Video upload failed");
      }
    };
    xhr.onerror = () => { setProgress(null); toast.error("Upload failed. Check your connection."); };
    setProgress(0);
    xhr.send(fd);
  };

  const busy = progress !== null;

  return (
    <div className="space-y-2">
      <div className="relative aspect-[9/16] w-full max-w-[200px] overflow-hidden rounded-xl border border-sky-900/10 bg-white/60">
        {value ? (
          <>
            <video src={value} poster={poster} controls muted playsInline preload="metadata" className="size-full bg-black object-cover" />
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => onChange("")} disabled={busy}
              aria-label="Remove video" className="absolute right-1.5 top-1.5 bg-white/85 hover:bg-white">
              <X />
            </Button>
          </>
        ) : (
          <div className="absolute inset-0 grid place-items-center p-3 text-center text-xs text-sky-950/55">
            <span className="flex flex-col items-center gap-1">
              <Film className="size-5" aria-hidden />
              No video. The Instagram embed will be used instead.
            </span>
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 grid place-items-center bg-white/85 text-sm font-medium text-sky-950">
            <span className="flex flex-col items-center gap-2">
              <Loader2 className="size-5 animate-spin" aria-hidden /> Uploading {progress}%
              <span className="h-1.5 w-28 overflow-hidden rounded-full bg-sky-900/10">
                <span className="block h-full bg-sky-700 transition-all" style={{ width: `${progress}%` }} />
              </span>
            </span>
          </div>
        )}
      </div>
      {media.cloudinaryEnabled && (
        <div role="radiogroup" aria-label="Video storage" className="inline-flex gap-1 rounded-lg border border-sky-900/10 bg-white/50 p-0.5 text-xs">
          {(["server", "cloudinary"] as const).map((p) => (
            <button key={p} type="button" role="radio" aria-checked={provider === p} onClick={() => setProvider(p)}
              className={cn("rounded-md px-2.5 py-1 font-medium", provider === p ? "bg-sky-900 text-white" : "text-sky-950/70")}>
              {p === "server" ? "Server" : "Cloudinary"}
            </button>
          ))}
        </div>
      )}
      <div>
        <input ref={inputRef} id={id} type="file" accept="video/mp4,video/webm,video/quicktime" className="sr-only"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
        <Button type="button" size="sm" className="btn-glass" onClick={() => inputRef.current?.click()} disabled={busy}>
          <Upload /> {value ? "Replace video" : "Upload video"}
        </Button>
        <p className="mt-1 text-[11px] text-sky-950/65">MP4 (H.264) recommended, 9:16, up to {MAX_MB} MB. Download it from your Instagram/Meta Business Suite.</p>
      </div>
    </div>
  );
}
