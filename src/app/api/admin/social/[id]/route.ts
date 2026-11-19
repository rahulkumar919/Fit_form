/**
 * PATCH  /api/admin/social/[id] — full edit, or quick toggle of isActive/showInReels/showInGallery
 * DELETE /api/admin/social/[id] — remove (and delete its uploaded video if unused)
 */
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { SocialPostModel } from "@/models/SocialPost";
import { badRequest, conflict, notFound, ok, serverError, zodError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/api/auth-guard";
import { logAdminAction } from "@/lib/audit";
import { OBJECT_ID_RE } from "@/lib/catalog-constants";
import { socialPostInputSchema, socialPostPatchSchema } from "@/lib/validations/homepage";
import { afterSocialChange } from "@/services/homepage";
import { linkTargetExists, releaseVideo } from "@/lib/social-sync";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;
    const { id } = await params;
    if (!OBJECT_ID_RE.test(id)) return notFound("Post not found");
    const body = await req.json().catch(() => null);
    await connectDB();
    const doc = await SocialPostModel.findById(id);
    if (!doc) return notFound("Post not found");

    if (body && typeof body === "object" && !("instagramUrl" in body)) {
      const parsed = socialPostPatchSchema.safeParse(body);
      if (!parsed.success) return zodError(parsed.error);
      const next = { showInReels: doc.showInReels, showInGallery: doc.showInGallery, ...parsed.data };
      if (!next.showInReels && !next.showInGallery) return badRequest("Show it in at least one section");
      doc.set(parsed.data);
      await doc.save();
      await logAdminAction(session!, "social.update", "social", id, `Updated ${Object.keys(parsed.data).join(", ")}`);
      await afterSocialChange();
      return ok({ id });
    }

    const parsed = socialPostInputSchema.safeParse(body);
    if (!parsed.success) return zodError(parsed.error);
    const input = parsed.data;
    if (await SocialPostModel.exists({ instagramUrl: input.instagramUrl, _id: { $ne: id } })) return conflict("This Instagram link is already added");
    if (!(await linkTargetExists(input.linkType, input.linkId))) return badRequest("The selected combo or product no longer exists");
    const oldVideo = doc.video;
    doc.set(input);
    await doc.save();
    if (oldVideo && oldVideo !== doc.video) await releaseVideo(oldVideo);
    await logAdminAction(session!, "social.update", "social", id, `Updated ${doc.kind} ${doc.instagramUrl}`);
    await afterSocialChange();
    return ok({ id });
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;
    const { id } = await params;
    if (!OBJECT_ID_RE.test(id)) return notFound("Post not found");
    await connectDB();
    const doc = await SocialPostModel.findByIdAndDelete(id);
    if (!doc) return notFound("Post not found");
    await releaseVideo(doc.video);
    await logAdminAction(session!, "social.delete", "social", id, `Removed ${doc.kind} ${doc.instagramUrl}`);
    await afterSocialChange();
    return ok({ id });
  } catch (err) {
    return serverError(err);
  }
}
