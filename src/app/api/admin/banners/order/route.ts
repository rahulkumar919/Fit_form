/** PUT /api/admin/banners/order — save slide order { ids: [...] } (admin only). */
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { BannerModel } from "@/models/Banner";
import { ok, serverError, zodError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/api/auth-guard";
import { logAdminAction } from "@/lib/audit";
import { reorderSchema } from "@/lib/validations/homepage";
import { afterHomepageChange } from "@/services/homepage";

export async function PUT(req: NextRequest) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;
    const parsed = reorderSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return zodError(parsed.error);
    await connectDB();
    await BannerModel.bulkWrite(
      parsed.data.ids.map((id, i) => ({ updateOne: { filter: { _id: id }, update: { $set: { order: i } } } })),
    );
    await logAdminAction(session!, "banner.reorder", "banner", "", `Reordered ${parsed.data.ids.length} banners`);
    await afterHomepageChange();
    return ok({ ids: parsed.data.ids });
  } catch (err) {
    return serverError(err);
  }
}
