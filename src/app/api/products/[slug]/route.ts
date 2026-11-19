/** GET /api/products/[slug] — public, active products only. */

import { NextRequest } from "next/server";
import { ok, notFound, serverError } from "@/lib/api/response";
import { getProductBySlug } from "@/services/catalog";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { slug } = await params;
    const product = await getProductBySlug(slug);
    if (!product) return notFound("Product not found");
    return ok(product);
  } catch (err) {
    return serverError(err);
  }
}
