/**
 * GET /api/products/[slug]/sales
 * Returns sales count for a product by slug (public, no auth required).
 * Only counts paid or COD orders; excludes cancelled / returned.
 */

import { NextRequest } from "next/server";
import { ok, notFound, serverError } from "@/lib/api/response";
import { getProductBySlug } from "@/services/catalog";
import { getProductSalesCount } from "@/services/reviews";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { slug } = await params;
    const product = await getProductBySlug(slug);
    if (!product) return notFound("Product not found");
    const sales = await getProductSalesCount(product.id);
    return ok(sales);
  } catch (err) {
    return serverError(err);
  }
}
