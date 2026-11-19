/** POST /api/admin/social — add an Instagram reel/post to the storefront (admin only). */
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { SocialPostModel } from "@/models/SocialPost";
import { badRequest, conflict, created, serverError, zodError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/api/auth-guard";
import { logAdminAction } from "@/lib/audit";
import { socialPostInputSchema } from "@/lib/validations/homepage";
import { afterSocialChange } from "@/services/homepage";
import { linkTargetExists } from "@/lib/social-sync";

const MAX_POSTS = 60;

export async function POST(req: NextRequest) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;
    const parsed = socialPostInputSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return zodError(parsed.error);
    const input = parsed.data;
    await connectDB();
    if ((await SocialPostModel.countDocuments()) >= MAX_POSTS) return badRequest(`You can keep up to ${MAX_POSTS} posts. Delete old ones first.`);
    if (await SocialPostModel.exists({ instagramUrl: input.instagramUrl })) return conflict("This Instagram link is already added");
    if (!(await linkTargetExists(input.linkType, input.linkId))) return badRequest("The selected combo or product no longer exists");
    const last = await SocialPostModel.findOne().sort({ order: -1 }).select("order").lean<{ order?: number }>();
    const doc = await SocialPostModel.create({ ...input, order: (last?.order ?? 0) + 1 });
    await logAdminAction(session!, "social.create", "social", String(doc._id), `Added ${doc.kind} ${doc.instagramUrl}`);
    await afterSocialChange();
    return created({ id: String(doc._id) });
  } catch (err) {
    return serverError(err);
  }
}
