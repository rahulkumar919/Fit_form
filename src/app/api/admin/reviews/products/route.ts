/**
 * GET /api/admin/reviews/products
 *
 * Returns all active products for the admin review product-picker.
 * Supports optional ?q= search by name.
 * No pagination cap — returns up to 500 products so admins can always find what they need.
 */

import { NextRequest } from "next/server";
import { connectDB, hasDB } from "@/lib/db/mongoose";
import { ProductModel } from "@/models/Product";
import { ok, serverError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/api/auth-guard";

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;
    if (!hasDB()) return ok({ products: [] });

    const q = (req.nextUrl.searchParams.get("q") ?? "").trim();

    await connectDB();

    const filter: Record<string, any> = { status: "active" };
    if (q) filter.name = { $regex: q, $options: "i" };

    const docs = await ProductModel.find(filter)
      .select("name slug images price categoryLabel sourceRef")
      .sort({ name: 1 })
      .limit(500)
      .lean();

    const products = docs.map((p: any) => ({
      id: String(p._id),
      name: p.name as string,
      slug: p.slug as string,
      image: (p.images as string[])?.[0] ?? "",
      price: p.price as number,
      categoryLabel: p.categoryLabel as string,
      sku: (p.sourceRef as string | undefined) ?? "",
    }));

    return ok({ products });
  } catch (err) {
    return serverError(err);
  }
}
