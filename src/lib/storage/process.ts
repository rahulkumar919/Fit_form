/**
 * Image processing with Sharp.
 *
 * - verifies the file really is an image (by decoding it, not trusting the MIME header)
 * - auto-rotates from EXIF, then strips ALL metadata (GPS, camera info)
 * - produces WebP renditions (large / medium / thumb) with adaptive quality:
 *   quality steps down only until the file is within budget, never below a floor,
 *   so photos are not visibly damaged just to hit a size target
 * - a tiny blur placeholder for progressive loading
 */

import sharp, { type Metadata } from "sharp";

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp", "avif", "heif", "tiff"]);

export interface Rendition {
  name: "large" | "medium" | "thumb";
  buffer: Buffer;
  width: number;
  height: number;
  bytes: number;
}

export interface ProcessedImage {
  renditions: Rendition[];
  blurDataURL: string;
  originalWidth: number;
  originalHeight: number;
  originalBytes: number;
  sourceFormat: string;
}

export class ImageValidationError extends Error {}

const TARGETS: { name: Rendition["name"]; width: number; budgetKb: number; floor: number }[] = [
  { name: "large", width: 1600, budgetKb: 220, floor: 68 },
  { name: "medium", width: 800, budgetKb: 60, floor: 62 },
  { name: "thumb", width: 320, budgetKb: 18, floor: 58 },
];

async function encode(input: Buffer, width: number, budgetKb: number, floor: number) {
  let quality = 82;
  for (;;) {
    const { data, info } = await sharp(input)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality, effort: 5, smartSubsample: true })
      .toBuffer({ resolveWithObject: true });
    if (data.length <= budgetKb * 1024 || quality <= floor) {
      return { buffer: data, width: info.width, height: info.height, bytes: data.length };
    }
    quality = Math.max(floor, quality - 6);
  }
}

export async function processImage(input: Buffer): Promise<ProcessedImage> {
  if (input.length === 0) throw new ImageValidationError("The file is empty");
  if (input.length > MAX_UPLOAD_BYTES) throw new ImageValidationError("Images must be 8 MB or smaller");

  let meta: Metadata;
  try {
    meta = await sharp(input, { limitInputPixels: 40_000_000 }).metadata();
  } catch {
    throw new ImageValidationError("This file is not a supported image");
  }
  if (!meta.format || !ALLOWED_FORMATS.has(meta.format)) throw new ImageValidationError("Use a JPG, PNG, WebP or AVIF image");
  if (!meta.width || !meta.height || meta.width < 200 || meta.height < 200) throw new ImageValidationError("Image must be at least 200×200 pixels");

  const renditions: Rendition[] = [];
  for (const t of TARGETS) {
    const r = await encode(input, t.width, t.budgetKb, t.floor);
    renditions.push({ name: t.name, ...r });
  }

  const blur = await sharp(input).rotate().resize(16).webp({ quality: 40 }).toBuffer();

  return {
    renditions,
    blurDataURL: `data:image/webp;base64,${blur.toString("base64")}`,
    originalWidth: meta.width,
    originalHeight: meta.height,
    originalBytes: input.length,
    sourceFormat: meta.format,
  };
}
