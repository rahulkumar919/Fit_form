/**
 * Reel video storage. Videos are stored as uploaded (no server-side transcoding):
 * export reels as MP4 (H.264) for the widest browser support.
 *
 *  - server:     STORAGE_DIR/videos/YYYY/MM/<id>.mp4, served by /media/videos/... with Range support
 *  - cloudinary: resource_type "video" in the melamart/reels folder
 */
import path from "node:path";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { STORAGE_DIR, cloudinaryConfigured, type StorageProvider } from "./index";

export const MAX_VIDEO_BYTES = 60 * 1024 * 1024; // 60 MB: plenty for a 90s 1080p reel

export class VideoValidationError extends Error {}

export type VideoExt = "mp4" | "webm";

/** Identify the container from magic bytes (never trust the browser's MIME type). */
export function detectVideo(buf: Buffer): VideoExt | null {
  if (buf.length < 12) return null;
  // ISO-BMFF (MP4 / MOV / M4V): bytes 4..7 = "ftyp"
  if (buf.subarray(4, 8).toString("latin1") === "ftyp") return "mp4";
  // Matroska / WebM EBML header
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) return "webm";
  return null;
}

export interface StoredVideo { provider: StorageProvider; key: string; url: string; bytes: number }

import { SERVER_VIDEO_RE } from "./video-url";
export { isAllowedVideoUrl } from "./video-url";

async function cloudinary() {
  const { v2 } = await import("cloudinary");
  v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return v2;
}

export const VideoStorageService = {
  async save(buf: Buffer, provider: StorageProvider): Promise<StoredVideo> {
    if (buf.length > MAX_VIDEO_BYTES) throw new VideoValidationError("Videos must be 60 MB or smaller");
    const ext = detectVideo(buf);
    if (!ext) throw new VideoValidationError("Upload an MP4 or WebM video");
    const id = randomUUID().replace(/-/g, "").slice(0, 16);

    if (provider === "cloudinary") {
      if (!cloudinaryConfigured()) throw new Error("Cloudinary is not configured");
      const cld = await cloudinary();
      const out = await new Promise<{ secure_url: string; public_id: string; bytes: number }>((resolve, reject) => {
        cld.uploader
          .upload_stream({ folder: "melamart/reels", public_id: id, resource_type: "video", overwrite: false, format: "mp4" }, (err, res) =>
            err || !res ? reject(err ?? new Error("Cloudinary upload failed")) : resolve(res as never),
          )
          .end(buf);
      });
      return { provider, key: out.public_id, url: out.secure_url, bytes: out.bytes };
    }

    const now = new Date();
    const folder = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
    const dir = path.join(/*turbopackIgnore: true*/ STORAGE_DIR, "videos", folder);
    await mkdir(dir, { recursive: true });
    const file = `${id}.${ext}`;
    await writeFile(path.join(/*turbopackIgnore: true*/ dir, file), buf, { flag: "wx" });
    return { provider: "server", key: `${folder}/${file}`, url: `/media/videos/${folder}/${file}`, bytes: buf.length };
  },

  /** Delete a stored video by its public URL (no-op for URLs we don't own). */
  async removeByUrl(url: string): Promise<void> {
    if (SERVER_VIDEO_RE.test(url)) {
      const rel = url.replace(/^\/media\/videos\//, "");
      await rm(path.join(/*turbopackIgnore: true*/ STORAGE_DIR, "videos", rel), { force: true });
      return;
    }
    const m = url.match(/\/video\/upload\/(?:v\d+\/)?(melamart\/reels\/[a-f0-9]{16})\.(mp4|webm)$/i);
    if (m && cloudinaryConfigured()) {
      const cld = await cloudinary();
      await cld.uploader.destroy(m[1], { resource_type: "video" });
    }
  },
};
