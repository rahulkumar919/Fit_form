/** POST /api/admin/media — upload one image (multipart: file, provider, alt). Admin only. */

import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { MediaAssetModel } from "@/models/MediaAsset";
import { badRequest, created, serverError } from "@/lib/api/response";
import { extractUserId, requireAdmin } from "@/lib/api/auth-guard";
import { logAdminAction } from "@/lib/audit";
import { rateLimited } from "@/lib/tracking/record";
import { ImageValidationError, MAX_UPLOAD_BYTES, processImage } from "@/lib/storage/process";
import { ImageStorageService, availableProviders, type StorageProvider } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;
    if (rateLimited(`upload:${extractUserId(session!)}`, 40)) return badRequest("Too many uploads. Please wait a minute.");

    const len = Number(req.headers.get("content-length") ?? 0);
    if (len > MAX_UPLOAD_BYTES + 64 * 1024) return badRequest("Images must be 8 MB or smaller");

    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) return badRequest("Choose an image to upload");
    const provider = String(form?.get("provider") ?? "server") as StorageProvider;
    if (!availableProviders().includes(provider)) {
      if (provider === "cloudinary") {
        return badRequest(
          "Cloudinary is not configured on this server. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to your environment variables and restart the app.",
        );
      }
      return badRequest("Unknown storage provider");
    }
    const alt = String(form?.get("alt") ?? "").trim().slice(0, 160);

    const processed = await processImage(Buffer.from(await file.arrayBuffer()));
    const stored = await ImageStorageService.save(processed, provider);
    const large = processed.renditions[0];

    await connectDB();
    const asset = await MediaAssetModel.create({
      name: file.name.replace(/[^\w.\- ]+/g, "").slice(0, 120) || "image",
      url: stored.url,
      provider,
      storageKey: stored.key,
      renditions: stored.renditions,
      width: large.width,
      height: large.height,
      sizeKb: Math.round(processed.renditions[1].bytes / 102.4) / 10,
      originalSizeKb: Math.round(processed.originalBytes / 1024),
      mime: "image/webp",
      alt,
      blurDataURL: processed.blurDataURL,
      uploadedBy: session!.user.email ?? "",
    });
    await logAdminAction(session!, "media.upload", "media", String(asset._id), `Uploaded ${asset.name} to ${provider}`);

    return created({
      id: String(asset._id),
      url: asset.url,
      provider,
      width: asset.width,
      height: asset.height,
      sizeKb: asset.sizeKb,
      originalSizeKb: asset.originalSizeKb,
      renditions: stored.renditions,
    });
  } catch (err) {
    if (err instanceof ImageValidationError) return badRequest(err.message);
    return serverError(err);
  }
}
