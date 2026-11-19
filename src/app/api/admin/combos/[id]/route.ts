/**
 * PATCH  /api/admin/combos/[id] — replace a combo's editable fields (admin only)
 * DELETE /api/admin/combos/[id] — delete a combo (admin only)
 */

import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { ProductModel } from "@/models/Product";
import { ComboModel } from "@/models/Combo";
import { ok, notFound, conflict, badRequest, serverError, zodError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/api/auth-guard";
import { logAdminAction } from "@/lib/audit";
import { OBJECT_ID_RE } from "@/lib/catalog-constants";
import { comboInputSchema } from "@/lib/validations/combo";
import { afterCatalogChange, buildComboItems } from "@/lib/catalog-sync";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;
    if (!OBJECT_ID_RE.test(id)) return notFound("Combo not found");

    const parsed = comboInputSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return zodError(parsed.error);
    const input = parsed.data;

    await connectDB();
    const combo = await ComboModel.findById(id);
    if (!combo) return notFound("Combo not found");

    if (input.slug !== combo.slug && (await ComboModel.exists({ slug: input.slug, _id: { $ne: id } }))) {
      return conflict(`The slug "${input.slug}" is already used by another combo`);
    }

    const found = await ProductModel.find({ _id: { $in: input.productIds }, status: "active" });
    const byId = new Map(found.map((p) => [String(p._id), p]));
    if (input.productIds.some((pid) => !byId.has(pid))) return badRequest("Every product in a combo must exist and be active");

    const { items, combinedPrice, availableSizes } = buildComboItems(input.productIds.map((pid) => byId.get(pid)));
    if (input.comboPrice >= combinedPrice) {
      return badRequest(`Combo price must be lower than the products' total (₹${combinedPrice}) so customers actually save`);
    }

    combo.set({
      name: input.name,
      slug: input.slug,
      tagline: input.tagline,
      description: input.description,
      images: input.images.length ? input.images : items.map((i) => i.image).filter(Boolean).slice(0, 3),
      items,
      combinedPrice,
      comboPrice: input.comboPrice,
      availableSizes,
      tags: input.tags,
      isTrending: input.isTrending,
      isBestSeller: input.isBestSeller,
      isActive: input.isActive,
      reelRef: input.reelRef || undefined,
      seoTitle: input.seoTitle || undefined,
      seoDescription: input.seoDescription || undefined,
    } as never);
    await combo.save();

    await logAdminAction(session!, "combo.update", "combo", id, `Updated combo "${combo.name}"`);
    await afterCatalogChange();
    return ok({ id, slug: combo.slug });
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
    if (!OBJECT_ID_RE.test(id)) return notFound("Combo not found");

    await connectDB();
    const combo = await ComboModel.findByIdAndDelete(id);
    if (!combo) return notFound("Combo not found");

    await logAdminAction(session!, "combo.delete", "combo", id, `Deleted combo "${combo.name}"`);
    await afterCatalogChange();
    return ok({ id });
  } catch (err) {
    return serverError(err);
  }
}
