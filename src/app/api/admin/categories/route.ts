/** POST /api/admin/categories — create a product category (admin only). */
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { CategoryModel } from "@/models/Category";
import { badRequest, conflict, created, serverError, zodError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/api/auth-guard";
import { logAdminAction } from "@/lib/audit";
import { isSystemCategory } from "@/lib/catalog-constants";
import { categoryInputSchema } from "@/lib/validations/homepage";
import { afterCategoryChange } from "@/services/homepage";

export async function POST(req: NextRequest) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;
    const parsed = categoryInputSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return zodError(parsed.error);
    const input = parsed.data;
    if (isSystemCategory(input.slug)) return badRequest(`"${input.slug}" is reserved. Pick another slug.`);

    await connectDB();
    if (await CategoryModel.exists({ slug: input.slug })) return conflict(`The slug "${input.slug}" is already used`);
    const last = await CategoryModel.findOne().sort({ order: -1 }).select("order").lean<{ order?: number }>();
    const doc = await CategoryModel.create({ ...input, order: (last?.order ?? 0) + 1, productCount: 0 });

    await logAdminAction(session!, "category.create", "category", String(doc._id), `Created category "${doc.name}"`);
    await afterCategoryChange();
    return created({ id: String(doc._id), slug: doc.slug });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) return conflict("That slug is already in use");
    return serverError(err);
  }
}
