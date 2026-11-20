/**
 * ImageStorageService — the only module that knows where image bytes live.
 * Pages and APIs store/delete images through this, never through a provider SDK.
 *
 * Providers:
 *  - "server":     files on this server's disk (STORAGE_DIR), served by /media/[...path].
 *                  On serverless hosts (Vercel) disk is NOT persistent: use Cloudinary there,
 *                  or mount a persistent volume / object storage on a VPS.
 *  - "cloudinary": uploaded to Cloudinary, delivered from its CDN.
 */

// This module uses Node.js built-ins and must never be bundled for the browser.
import "server-only";

import type { ProcessedImage } from "./process";

export type StorageProvider = "server" | "cloudinary";

export interface StoredRendition { name: string; url: string; width: number; height: number; bytes: number }
export interface StoredImage {
  provider: StorageProvider;
  /** server: relative folder key; cloudinary: public_id prefix */
  key: string;
  url: string;
  renditions: StoredRendition[];
}

export function getStorageDir(): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require("path") as typeof import("path");
  return path.resolve(process.cwd(), process.env.STORAGE_DIR?.trim() || "storage/uploads");
}

/** @deprecated use getStorageDir() — kept for any existing imports */
export const STORAGE_DIR = /* evaluated lazily via getter */ (() => {
  if (typeof window !== "undefined") return "";
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require("path") as typeof import("path");
  return path.resolve(process.cwd(), process.env.STORAGE_DIR?.trim() || "storage/uploads");
})();

export function cloudinaryConfigured(): boolean {
  const n = (process.env.CLOUDINARY_CLOUD_NAME ?? "").trim().replace(/^["']|["']$/g, "");
  const k = (process.env.CLOUDINARY_API_KEY ?? "").trim().replace(/^["']|["']$/g, "");
  const s = (process.env.CLOUDINARY_API_SECRET ?? "").trim().replace(/^["']|["']$/g, "");
  return !!n && !!k && !!s && !/^your-/.test(n) && !/^your-/.test(k) && !/^your-/.test(s);
}

export function availableProviders(): StorageProvider[] {
  return cloudinaryConfigured() ? ["server", "cloudinary"] : ["server"];
}

/* ───────────── server disk ───────────── */

async function saveToServer(img: ProcessedImage): Promise<StoredImage> {
  const path = await import("node:path");
  const { mkdir, writeFile } = await import("node:fs/promises");
  const { randomUUID } = await import("node:crypto");

  const storageDir = getStorageDir();
  const now = new Date();
  const folder = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const id = randomUUID().replace(/-/g, "").slice(0, 16);
  const dir = path.join(storageDir, folder);
  await mkdir(dir, { recursive: true });

  const renditions: StoredRendition[] = [];
  for (const r of img.renditions) {
    const file = `${id}-${r.name}.webp`;
    await writeFile(path.join(dir, file), r.buffer, { flag: "wx" });
    renditions.push({ name: r.name, url: `/media/${folder}/${file}`, width: r.width, height: r.height, bytes: r.bytes });
  }
  return { provider: "server", key: `${folder}/${id}`, url: renditions[0].url, renditions };
}

async function deleteFromServer(key: string) {
  const path = await import("node:path");
  const { rm } = await import("node:fs/promises");

  const storageDir = getStorageDir();
  if (!/^\d{4}\/\d{2}\/[a-f0-9]{16}$/.test(key)) return;
  for (const name of ["large", "medium", "thumb"]) {
    await rm(path.join(storageDir, `${key}-${name}.webp`), { force: true });
  }
}

/* ───────────── Cloudinary ───────────── */

async function cloudinary() {
  const { v2 } = await import("cloudinary");
  const cloud_name = (process.env.CLOUDINARY_CLOUD_NAME ?? "").trim().replace(/^["']|["']$/g, "");
  const api_key = (process.env.CLOUDINARY_API_KEY ?? "").trim().replace(/^["']|["']$/g, "");
  const api_secret = (process.env.CLOUDINARY_API_SECRET ?? "").trim().replace(/^["']|["']$/g, "");

  v2.config({
    cloud_name,
    api_key,
    api_secret,
    secure: true,
  });
  return v2;
}

async function saveToCloudinary(img: ProcessedImage): Promise<StoredImage> {
  const { randomUUID } = await import("node:crypto");
  const cld = await cloudinary();
  const id = randomUUID().replace(/-/g, "").slice(0, 16);

  // Upload large, medium, and thumb in parallel
  const uploads = img.renditions.map((r) => {
    return new Promise<StoredRendition>((resolve, reject) => {
      cld.uploader
        .upload_stream(
          { folder: "melamart", public_id: `${id}-${r.name}`, resource_type: "image", overwrite: false },
          (err, out) => {
            if (err || !out) {
              const msg = (err as { message?: string })?.message || "Cloudinary upload failed";
              const code = (err as { http_code?: number })?.http_code;
              reject(new Error(`Cloudinary upload failed${code ? ` [HTTP ${code}]` : ""}: ${msg}`));
            } else {
              const res = out as { secure_url: string; width: number; height: number; bytes: number };
              resolve({ name: r.name, url: res.secure_url, width: res.width, height: res.height, bytes: res.bytes });
            }
          },
        )
        .end(r.buffer);
    });
  });

  const renditions = await Promise.all(uploads);
  return { provider: "cloudinary", key: `melamart/${id}`, url: renditions[0].url, renditions };
}

async function deleteFromCloudinary(key: string) {
  if (!/^melamart\/[a-f0-9]{16}$/.test(key)) return;
  const cld = await cloudinary();
  await cld.api.delete_resources(["large", "medium", "thumb"].map((n) => `${key}-${n}`));
}

/* ───────────── public API ───────────── */

export const ImageStorageService = {
  async save(img: ProcessedImage, provider: StorageProvider): Promise<StoredImage> {
    if (provider === "cloudinary") {
      if (!cloudinaryConfigured()) throw new Error("Cloudinary is not configured");
      return saveToCloudinary(img);
    }
    return saveToServer(img);
  },
  async remove(provider: StorageProvider, key: string): Promise<void> {
    if (provider === "cloudinary") return deleteFromCloudinary(key);
    return deleteFromServer(key);
  },
};
