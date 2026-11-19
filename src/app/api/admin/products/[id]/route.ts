/**
 * PATCH  /api/admin/products/[id] — replace a product's editable fields (admin only)
 * DELETE /api/admin/products/[id] — delete a product (admin only)
 */

import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { ProductModel } from "@/models/Product";
import { badRequest, ok, notFound, conflict, serverError, zodError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/api/auth-guard";
import { logAdminAction } from "@/lib/audit";
import { OBJECT_ID_RE } from "@/lib/catalog-constants";
import { productInputSchema } from "@/lib/validations/product";
import { afterCatalogChange, applySource, buildProductDoc, resolveProductCategory, combosUsingProduct, syncCombosForProduct } from "@/lib/catalog-sync";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;
    if (!OBJECT_ID_RE.test(id)) return notFound("Product not found");

    const parsed = productInputSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return zodError(parsed.error);
    const input = parsed.data;

    await connectDB();
    const label = await resolveProductCategory(input.category);
    if (!label) return badRequest("Choose a valid category (create it in Admin → Categories first)");
    const product = await ProductModel.findById(id);
    if (!product) return notFound("Product not found");

    if (input.slug !== product.slug && (await ProductModel.exists({ slug: input.slug, _id: { $ne: id } }))) {
      return conflict(`The slug "${input.slug}" is already used by another product`);
    }

    // A live combo must never point at a product customers cannot buy.
    if (product.status === "active" && input.status !== "active") {
      const active = await combosUsingProduct(id, true);
      if (active.length) {
        return conflict(`This product is part of active combos (${active.map((c) => c.name).join(", ")}). Remove it from them before unpublishing.`);
      }
    }

    product.set(buildProductDoc(input, label) as never);
    await product.save();

    const priceWarnings = await syncCombosForProduct(product);
    await applySource(product._id, product.name, product.price, input.source);
    await logAdminAction(session!, "product.update", "product", id, `Updated product "${product.name}"`);
    await afterCatalogChange();

    return ok({
      id,
      slug: product.slug,
      warnings: priceWarnings.map((n) => `Combo "${n}" no longer saves money. Review its combo price.`),
    });
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
    if (!OBJECT_ID_RE.test(id)) return notFound("Product not found");

    await connectDB();
    const product = await ProductModel.findById(id);
    if (!product) return notFound("Product not found");

    const combos = await combosUsingProduct(id);
    if (combos.length) {
      return conflict(`Cannot delete: used in combos (${combos.map((c) => c.name).join(", ")}). Remove it from them first, or archive it instead.`);
    }

    await applySource(product._id, product.name, product.price, null);
    await product.deleteOne();
    await logAdminAction(session!, "product.delete", "product", id, `Deleted product "${product.name}"`);
    await afterCatalogChange();

    return ok({ id });
  } catch (err) {
    return serverError(err);
  }
}
