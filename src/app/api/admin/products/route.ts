/** POST /api/admin/products — create a product (admin only). */

import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { ProductModel } from "@/models/Product";
import { badRequest, created, conflict, serverError, zodError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/api/auth-guard";
import { logAdminAction } from "@/lib/audit";
import { productInputSchema } from "@/lib/validations/product";
import { afterCatalogChange, applySource, buildProductDoc, resolveProductCategory } from "@/lib/catalog-sync";

export async function POST(req: NextRequest) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;

    const parsed = productInputSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return zodError(parsed.error);
    const input = parsed.data;

    await connectDB();
    const label = await resolveProductCategory(input.category);
    if (!label) return badRequest("Choose a valid category (create it in Admin → Categories first)");
    if (await ProductModel.exists({ slug: input.slug })) {
      return conflict(`The slug "${input.slug}" is already used by another product`);
    }

    const doc = await new ProductModel(buildProductDoc(input, label)).save();
    await applySource(doc._id, doc.name, doc.price, input.source);
    await logAdminAction(session!, "product.create", "product", String(doc._id), `Created product "${doc.name}"`);
    await afterCatalogChange();

    return created({ id: String(doc._id), slug: doc.slug });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) return conflict("That slug is already in use");
    return serverError(err);
  }
}
