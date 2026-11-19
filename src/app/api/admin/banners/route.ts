/** POST /api/admin/banners — create a homepage banner (admin only). */
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { BannerModel } from "@/models/Banner";
import { badRequest, created, serverError, zodError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/api/auth-guard";
import { logAdminAction } from "@/lib/audit";
import { bannerInputSchema } from "@/lib/validations/homepage";
import { afterHomepageChange } from "@/services/homepage";

const MAX_BANNERS = 20;

export async function POST(req: NextRequest) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;
    const parsed = bannerInputSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return zodError(parsed.error);
    await connectDB();
    if ((await BannerModel.countDocuments()) >= MAX_BANNERS) return badRequest(`You can keep up to ${MAX_BANNERS} banners. Delete an old one first.`);
    const last = await BannerModel.findOne().sort({ order: -1 }).select("order").lean<{ order?: number }>();
    const doc = await BannerModel.create({ ...parsed.data, order: (last?.order ?? 0) + 1 });
    await logAdminAction(session!, "banner.create", "banner", String(doc._id), `Created banner "${doc.title || doc.alt || "image"}"`);
    await afterHomepageChange();
    return created({ id: String(doc._id) });
  } catch (err) {
    return serverError(err);
  }
}
