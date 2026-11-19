/** POST /api/admin/media/video — upload one reel video (multipart: file, provider). Admin only. */
import { NextRequest } from "next/server";
import { badRequest, created, serverError } from "@/lib/api/response";
import { extractUserId, requireAdmin } from "@/lib/api/auth-guard";
import { logAdminAction } from "@/lib/audit";
import { rateLimited } from "@/lib/tracking/record";
import { availableProviders, type StorageProvider } from "@/lib/storage";
import { MAX_VIDEO_BYTES, VideoStorageService, VideoValidationError } from "@/lib/storage/video";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;
    if (rateLimited(`video-upload:${extractUserId(session!)}`, 10)) return badRequest("Too many uploads. Please wait a minute.");

    const len = Number(req.headers.get("content-length") ?? 0);
    if (len > MAX_VIDEO_BYTES + 256 * 1024) return badRequest("Videos must be 60 MB or smaller");

    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) return badRequest("Choose a video to upload");
    if (file.size > MAX_VIDEO_BYTES) return badRequest("Videos must be 60 MB or smaller");
    const provider = String(form?.get("provider") ?? "server") as StorageProvider;
    if (!availableProviders().includes(provider)) return badRequest(provider === "cloudinary" ? "Cloudinary is not configured" : "Unknown storage provider");

    const stored = await VideoStorageService.save(Buffer.from(await file.arrayBuffer()), provider);
    await logAdminAction(session!, "media.video_upload", "media", stored.key, `Uploaded reel video (${Math.round(stored.bytes / 1024 / 102.4) / 10} MB) to ${provider}`);
    return created({ url: stored.url, provider, sizeMb: Math.round(stored.bytes / 1024 / 102.4) / 10 });
  } catch (err) {
    if (err instanceof VideoValidationError) return badRequest(err.message);
    return serverError(err);
  }
}
