/**
 * PATCH  /api/admin/categories/[id] — full edit, or quick toggle of isActive/showOnHome/showInNav
 * DELETE /api/admin/categories/[id] — delete an empty, non-system category
 */
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { CategoryModel } from "@/models/Category";
import { ProductModel } from "@/models/Product";
import { ComboModel } from "@/models/Combo";
import { badRequest, conflict, notFound, ok, serverError, zodError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/api/auth-guard";
import { logAdminAction } from "@/lib/audit";
import { isSystemCategory, OBJECT_ID_RE } from "@/lib/catalog-constants";
import { categoryInputSchema, categoryPatchSchema } from "@/lib/validations/homepage";
import { afterCategoryChange } from "@/services/homepage";
import { afterCatalogChange } from "@/lib/catalog-sync";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;
    const { id } = await params;
    if (!OBJECT_ID_RE.test(id)) return notFound("Category not found");
    const body = await req.json().catch(() => null);

    await connectDB();
    const cat = await CategoryModel.findById(id);
    if (!cat) return notFound("Category not found");

    // Quick toggles from the list (no name in body)
    if (body && typeof body === "object" && !("name" in body)) {
      const parsed = categoryPatchSchema.safeParse(body);
      if (!parsed.success) return zodError(parsed.error);
      cat.set(parsed.data);
      await cat.save();
      await logAdminAction(session!, "category.update", "category", id, `Updated "${cat.name}" (${Object.keys(parsed.data).join(", ")})`);
      await afterCategoryChange();
      return ok({ id });
    }

    const parsed = categoryInputSchema.safeParse(body);
    if (!parsed.success) return zodError(parsed.error);
    const input = parsed.data;
    const oldSlug = cat.slug;
    const oldName = cat.name;

    if (input.slug !== oldSlug) {
      if (isSystemCategory(oldSlug)) return badRequest("Built-in collections keep their URL. You can still rename them.");
      if (isSystemCategory(input.slug)) return badRequest(`"${input.slug}" is reserved. Pick another slug.`);
      if (await CategoryModel.exists({ slug: input.slug, _id: { $ne: id } })) return conflict(`The slug "${input.slug}" is already used`);
      // Changing the URL of a category that holds products would break links and SEO.
      const used = await ProductModel.countDocuments({ category: oldSlug });
      if (used > 0) return conflict(`${used} product(s) use this category, so its URL can't change. Rename it instead.`);
    }

    cat.set(input);
    await cat.save();

    // Keep denormalised labels on products and combo snapshots in sync with the new name.
    if (input.name !== oldName && !isSystemCategory(cat.slug)) {
      await ProductModel.updateMany({ category: cat.slug }, { $set: { categoryLabel: input.name } });
      await ComboModel.updateMany(
        { "items.category": cat.slug },
        { $set: { "items.$[it].categoryLabel": input.name } },
        { arrayFilters: [{ "it.category": cat.slug }] },
      );
      await afterCatalogChange();
    }

    await logAdminAction(session!, "category.update", "category", id, `Updated category "${cat.name}"`);
    await afterCategoryChange();
    return ok({ id, slug: cat.slug });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) return conflict("That slug is already in use");
    return serverError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;
    const { id } = await params;
    if (!OBJECT_ID_RE.test(id)) return notFound("Category not found");
    await connectDB();
    const cat = await CategoryModel.findById(id);
    if (!cat) return notFound("Category not found");
    if (isSystemCategory(cat.slug)) return badRequest("Built-in collections can't be deleted. Hide them instead.");
    const used = await ProductModel.countDocuments({ category: cat.slug });
    if (used > 0) return conflict(`Move the ${used} product(s) in "${cat.name}" to another category first, or hide the category.`);
    await cat.deleteOne();
    await logAdminAction(session!, "category.delete", "category", id, `Deleted category "${cat.name}"`);
    await afterCategoryChange();
    return ok({ id });
  } catch (err) {
    return serverError(err);
  }
}
