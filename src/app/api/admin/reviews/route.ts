/**
 * GET  /api/admin/reviews — paginated admin list with search/filter
 * POST /api/admin/reviews — create a store testimonial (admin-authored review)
 *
 * Query params for GET:
 *   q       — search customer name or product name
 *   status  — pending | approved | rejected | all  (default: all)
 *   source  — customer | store_testimonial | all    (default: all)
 *   rating  — 1–5 | 0 for all                       (default: 0)
 *   page    — 1-based page number                   (default: 1)
 *   limit   — rows per page, max 50                 (default: 20)
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { Types } from "mongoose";
import { connectDB, hasDB } from "@/lib/db/mongoose";
import { ReviewModel } from "@/models/Review";
import { ProductModel } from "@/models/Product";
import { badRequest, created, ok, serverError, zodError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/api/auth-guard";
import { logAdminAction } from "@/lib/audit";
import { recomputeRatings } from "@/services/reviews";
import { afterCatalogChange } from "@/lib/catalog-sync";
import { OBJECT_ID_RE } from "@/lib/catalog-constants";

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;
    if (!hasDB()) return ok({ reviews: [], total: 0, page: 1, totalPages: 0 });

    const url = req.nextUrl;
    const q = (url.searchParams.get("q") ?? "").trim();
    const statusFilter = url.searchParams.get("status") ?? "all";
    const sourceFilter = url.searchParams.get("source") ?? "all";
    const ratingFilter = parseInt(url.searchParams.get("rating") ?? "0", 10);
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10)));
    const skip = (page - 1) * limit;

    await connectDB();

    // Build base match
    const match: Record<string, any> = {};
    if (statusFilter !== "all") match.status = statusFilter;
    if (sourceFilter !== "all") match.source = sourceFilter;
    if (ratingFilter >= 1 && ratingFilter <= 5) match.rating = ratingFilter;

    // If search term, find matching product IDs first
    let productIdFilter: Types.ObjectId[] | null = null;
    if (q) {
      const productMatches = await ProductModel.find({
        name: { $regex: q, $options: "i" },
      }).select("_id").lean();
      productIdFilter = productMatches.map((p: any) => p._id);
      match.$or = [
        { author: { $regex: q, $options: "i" } },
        { productId: { $in: productIdFilter } },
      ];
    }

    const [docs, total] = await Promise.all([
      ReviewModel.find(match)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ReviewModel.countDocuments(match),
    ]);

    // Join product names + images
    const productIds = [...new Set(docs.map((d: any) => String(d.productId)))];
    const products = await ProductModel.find({ _id: { $in: productIds } })
      .select("name slug images sourceRef")
      .lean();
    const byId = new Map(products.map((p: any) => [String(p._id), p]));

    const reviews = docs.map((d: any) => ({
      id: String(d._id),
      productId: String(d.productId),
      productName: byId.get(String(d.productId))?.name ?? "Deleted product",
      productSlug: byId.get(String(d.productId))?.slug ?? "",
      productImage: (byId.get(String(d.productId))?.images as string[] | undefined)?.[0] ?? "",
      productSku: (byId.get(String(d.productId))?.sourceRef as string | undefined) ?? "",
      author: d.author,
      customerImage: d.customerImage ?? "",
      rating: d.rating,
      title: d.title ?? "",
      body: d.body ?? "",
      status: d.status,
      source: d.source ?? "customer",
      verified: !!d.verified,
      featured: !!d.featured,
      images: d.images ?? [],
      isApproved: !!d.isApproved,
      helpfulCount: d.helpfulCount ?? 0,
      createdAt: new Date(d.createdAt).toISOString(),
    }));

    return ok({ reviews, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    return serverError(err);
  }
}

const createSchema = z.object({
  productId: z.string().regex(OBJECT_ID_RE, "Invalid product"),
  customerName: z.string().trim().min(1, "Customer name is required").max(80),
  customerImage: z.string().trim().max(500).optional().default(""),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(80).optional().default(""),
  body: z.string().trim().max(1500).optional().default(""),
  images: z.array(z.string().max(500)).max(5).optional().default([]),
  source: z.enum(["customer", "store_testimonial"]).default("store_testimonial"),
  status: z.enum(["pending", "approved", "rejected"]).default("approved"),
  featured: z.boolean().optional().default(false),
  reviewDate: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;
    if (!hasDB()) return badRequest("Database unavailable");

    const body = await req.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return zodError(parsed.error);

    await connectDB();

    // Verify product exists
    const product = await ProductModel.findById(parsed.data.productId).select("_id").lean();
    if (!product) return badRequest("Product not found");

    const isApproved = parsed.data.status === "approved";

    const review = await ReviewModel.create({
      productId: new Types.ObjectId(parsed.data.productId),
      userId: null,          // admin-created: no customer userId
      orderId: null,         // admin-created: no order
      author: parsed.data.customerName,
      customerImage: parsed.data.customerImage,
      rating: parsed.data.rating,
      title: parsed.data.title,
      body: parsed.data.body,
      images: parsed.data.images,
      source: parsed.data.source,
      // Admin-created store testimonials are NEVER marked as verified purchase
      verified: false,
      status: parsed.data.status,
      isApproved,
      featured: parsed.data.featured,
      ...(parsed.data.reviewDate ? { createdAt: new Date(parsed.data.reviewDate) } : {}),
    });

    if (isApproved) {
      await recomputeRatings(parsed.data.productId);
      await afterCatalogChange();
    }

    await logAdminAction(
      session!,
      "review.create",
      "review",
      String(review._id),
      `${parsed.data.source} — ${parsed.data.rating}★ by ${parsed.data.customerName}`,
    );

    return created({ id: String(review._id) });
  } catch (err: unknown) {
    // E11000 = duplicate key — customer already reviewed this product
    if (
      typeof err === "object" && err !== null &&
      "code" in err && (err as { code: number }).code === 11000
    ) {
      return badRequest("This customer has already reviewed this product.");
    }
    return serverError(err);
  }
}
