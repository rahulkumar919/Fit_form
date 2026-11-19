/** POST /api/admin/combos — create a combo (admin only). */

import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { ProductModel } from "@/models/Product";
import { ComboModel } from "@/models/Combo";
import { created, conflict, badRequest, serverError, zodError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/api/auth-guard";
import { logAdminAction } from "@/lib/audit";
import { comboInputSchema } from "@/lib/validations/combo";
import { afterCatalogChange, buildComboItems } from "@/lib/catalog-sync";

export async function POST(req: NextRequest) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;

    const parsed = comboInputSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return zodError(parsed.error);
    const input = parsed.data;

    await connectDB();
    if (await ComboModel.exists({ slug: input.slug })) {
      return conflict(`The slug "${input.slug}" is already used by another combo`);
    }

    const found = await ProductModel.find({ _id: { $in: input.productIds }, status: "active" });
    const byId = new Map(found.map((p) => [String(p._id), p]));
    const missing = input.productIds.filter((pid) => !byId.has(pid));
    if (missing.length) return badRequest("Every product in a combo must exist and be active");

    const { items, combinedPrice, availableSizes } = buildComboItems(input.productIds.map((pid) => byId.get(pid)));
    if (input.comboPrice >= combinedPrice) {
      return badRequest(`Combo price must be lower than the products' total (₹${combinedPrice}) so customers actually save`);
    }

    const combo = await new ComboModel({
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
    }).save();

    await logAdminAction(session!, "combo.create", "combo", String(combo._id), `Created combo "${combo.name}"`);
    await afterCatalogChange();
    return created({ id: String(combo._id), slug: combo.slug });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) return conflict("That slug is already in use");
    return serverError(err);
  }
}
