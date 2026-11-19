/**
 * GET /api/admin/products/[id]/sales
 * Returns full sales breakdown for a product (admin only).
 */

import { NextRequest } from "next/server";
import { ok, notFound, serverError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/api/auth-guard";
import { getProductSalesCount } from "@/services/reviews";
import { connectDB, hasDB } from "@/lib/db/mongoose";
import { ProductModel } from "@/models/Product";
import { OBJECT_ID_RE } from "@/lib/catalog-constants";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;
    const { id } = await params;
    if (!OBJECT_ID_RE.test(id)) return notFound("Product not found");
    if (!hasDB()) return ok({ total: 0, last7: 0, last30: 0, totalOrders: 0 });

    await connectDB();
    const exists = await ProductModel.exists({ _id: id });
    if (!exists) return notFound("Product not found");

    const sales = await getProductSalesCount(id);
    return ok(sales);
  } catch (err) {
    return serverError(err);
  }
}
