/** GET /api/products?category=&limit=&skip= — public, active products only. Writes live under /api/admin/products. */

import { NextRequest } from "next/server";
import { ok, serverError } from "@/lib/api/response";
import { getProductsByCategory } from "@/services/catalog";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") ?? "all-products";
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "50") || 50, 1), 100);
    const skip = Math.max(parseInt(searchParams.get("skip") ?? "0") || 0, 0);
    const list = await getProductsByCategory(category);
    return ok(list.slice(skip, skip + limit));
  } catch (err) {
    return serverError(err);
  }
}
