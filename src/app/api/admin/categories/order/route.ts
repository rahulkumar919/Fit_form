/** PUT /api/admin/categories/order — save display order { ids: [...] } (admin only). */
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { CategoryModel } from "@/models/Category";
import { ok, serverError, zodError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/api/auth-guard";
import { logAdminAction } from "@/lib/audit";
import { reorderSchema } from "@/lib/validations/homepage";
import { afterCategoryChange } from "@/services/homepage";

export async function PUT(req: NextRequest) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;
    const parsed = reorderSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return zodError(parsed.error);
    await connectDB();
    await CategoryModel.bulkWrite(
      parsed.data.ids.map((id, i) => ({ updateOne: { filter: { _id: id }, update: { $set: { order: i } } } })),
    );
    await logAdminAction(session!, "category.reorder", "category", "", `Reordered ${parsed.data.ids.length} categories`);
    await afterCategoryChange();
    return ok({ ids: parsed.data.ids });
  } catch (err) {
    return serverError(err);
  }
}
