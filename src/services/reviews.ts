/**
 * Reviews: eligibility, public reads and rating aggregation.
 * Ratings shown anywhere on the store come only from approved, verified reviews.
 */

import { Types } from "mongoose";
import { connectDB, hasDB } from "@/lib/db/mongoose";
import { ReviewModel } from "@/models/Review";
import { OrderModel } from "@/models/Order";
import { ProductModel } from "@/models/Product";
import { ComboModel } from "@/models/Combo";
import { OBJECT_ID_RE } from "@/lib/catalog-constants";

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface PublicReview {
  id: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  date: string;
  verified: boolean;
  source: string;
  images: string[];
  customerImage?: string;
  helpfulCount: number;
  featured: boolean;
}

export interface ReviewSummary {
  average: number;
  count: number;
  /** counts for 5,4,3,2,1 stars */
  breakdown: { star: number; count: number }[];
}

/** First name + last initial ("Riya S."), never the full name or email. */
export function displayName(full: string | null | undefined): string {
  const parts = (full ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Verified buyer";
  const first = parts[0].slice(0, 20);
  return parts.length > 1 ? `${first} ${parts[parts.length - 1][0].toUpperCase()}.` : first;
}

function mapToPublicReview(d: any): PublicReview {
  return {
    id: String(d._id),
    author: d.author,
    rating: d.rating,
    title: d.title ?? "",
    body: d.body ?? "",
    date: new Date(d.createdAt).toISOString(),
    verified: !!d.verified,
    source: d.source ?? "customer",
    images: d.images ?? [],
    customerImage: d.customerImage || undefined,
    helpfulCount: d.helpfulCount ?? 0,
    featured: !!d.featured,
  };
}

function buildSummary(agg: any[]): ReviewSummary {
  const byStar = new Map<number, number>(agg.map((a: any) => [a._id, a.n]));
  const count = [...byStar.values()].reduce((a, b) => a + b, 0);
  const sum = [...byStar.entries()].reduce((a, [star, n]) => a + star * n, 0);
  return {
    average: count ? Math.round((sum / count) * 10) / 10 : 0,
    count,
    breakdown: [5, 4, 3, 2, 1].map((star) => ({ star, count: byStar.get(star) ?? 0 })),
  };
}

export async function getProductReviews(productId: string, limit = 20): Promise<{ reviews: PublicReview[]; summary: ReviewSummary }> {
  const empty = { reviews: [], summary: { average: 0, count: 0, breakdown: [5, 4, 3, 2, 1].map((star) => ({ star, count: 0 })) } };
  if (!hasDB() || !OBJECT_ID_RE.test(productId)) return empty;
  await connectDB();
  const pid = new Types.ObjectId(productId);
  const [docs, agg] = await Promise.all([
    ReviewModel.find({ productId: pid, status: "approved" }).sort({ createdAt: -1 }).limit(limit).lean(),
    ReviewModel.aggregate([
      { $match: { productId: pid, status: "approved" } },
      { $group: { _id: "$rating", n: { $sum: 1 } } },
    ]),
  ]);
  return {
    reviews: docs.map((d: any) => mapToPublicReview(d)),
    summary: buildSummary(agg),
  };
}

export async function getProductReviewsPaginated(
  productId: string,
  opts: { sort?: string; star?: number; page?: number; limit?: number },
): Promise<{ reviews: PublicReview[]; summary: ReviewSummary; total: number; hasMore: boolean }> {
  const empty = {
    reviews: [],
    summary: { average: 0, count: 0, breakdown: [5, 4, 3, 2, 1].map((star) => ({ star, count: 0 })) },
    total: 0,
    hasMore: false,
  };
  if (!hasDB() || !OBJECT_ID_RE.test(productId)) return empty;
  await connectDB();

  const pid = new Types.ObjectId(productId);
  const sort = opts.sort ?? "newest";
  const star = opts.star ?? 0;
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(50, Math.max(1, opts.limit ?? 10));
  const skip = (page - 1) * limit;

  const baseQuery: Record<string, any> = { productId: pid, status: "approved" };
  if (star >= 1 && star <= 5) baseQuery.rating = star;

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    newest: { createdAt: -1 },
    highest: { rating: -1 },
    lowest: { rating: 1 },
    helpful: { helpfulCount: -1 },
  };
  const sortObj = sortMap[sort] ?? sortMap.newest;

  const [docs, agg, total] = await Promise.all([
    ReviewModel.find(baseQuery).sort(sortObj).skip(skip).limit(limit).lean(),
    ReviewModel.aggregate([
      { $match: { productId: pid, status: "approved" } },
      { $group: { _id: "$rating", n: { $sum: 1 } } },
    ]),
    ReviewModel.countDocuments(baseQuery),
  ]);

  return {
    reviews: docs.map((d: any) => mapToPublicReview(d)),
    summary: buildSummary(agg),
    total,
    hasMore: skip + docs.length < total,
  };
}

/** Latest approved reviews across the store (homepage). */
export async function getRecentReviews(limit = 6) {
  if (!hasDB()) return [];
  await connectDB();
  const docs = await ReviewModel.find({ status: "approved", rating: { $gte: 4 } }).sort({ createdAt: -1 }).limit(limit).lean();
  const products = await ProductModel.find({ _id: { $in: docs.map((d: any) => d.productId) } }).select("name slug").lean();
  const byId = new Map(products.map((p: any) => [String(p._id), p]));
  return docs.map((d: any) => ({
    id: String(d._id),
    author: d.author,
    rating: d.rating,
    text: d.body || d.title,
    productName: byId.get(String(d.productId))?.name ?? "",
    productSlug: byId.get(String(d.productId))?.slug ?? "",
  }));
}

export type Eligibility =
  | { canReview: true; orderId: string }
  | { canReview: false; reason: "not_signed_in" | "not_purchased" | "already_reviewed" };

/** A customer may review a product once, after an order containing it was delivered. */
export async function checkEligibility(userId: string, productId: string): Promise<Eligibility> {
  if (!userId || !OBJECT_ID_RE.test(userId) || !OBJECT_ID_RE.test(productId)) return { canReview: false, reason: "not_purchased" };
  await connectDB();
  const existing = await ReviewModel.exists({ productId, userId });
  if (existing) return { canReview: false, reason: "already_reviewed" };
  const order = await OrderModel.findOne({
    userId,
    status: "delivered",
    $or: [{ "items.refId": productId }, { "items.selections.productId": productId }],
  }).select("_id").lean();
  if (!order) return { canReview: false, reason: "not_purchased" };
  return { canReview: true, orderId: String((order as any)._id) };
}

/** Recompute stored rating/reviewCount for a product and every combo that contains it. */
export async function recomputeRatings(productId: string): Promise<void> {
  await connectDB();
  const pid = new Types.ObjectId(productId);
  const [agg] = await ReviewModel.aggregate([
    { $match: { productId: pid, status: "approved" } },
    { $group: { _id: null, avg: { $avg: "$rating" }, n: { $sum: 1 } } },
  ]);
  const rating = agg ? Math.round(agg.avg * 10) / 10 : 0;
  const reviewCount = agg?.n ?? 0;
  await ProductModel.updateOne({ _id: pid }, { $set: { rating, reviewCount } });

  const combos = await ComboModel.find({ "items.productId": pid }).select("items").lean();
  for (const c of combos as any[]) {
    const ids = c.items.map((i: any) => i.productId);
    const [cAgg] = await ReviewModel.aggregate([
      { $match: { productId: { $in: ids }, status: "approved" } },
      { $group: { _id: null, avg: { $avg: "$rating" }, n: { $sum: 1 } } },
    ]);
    await ComboModel.updateOne(
      { _id: c._id },
      { $set: { rating: cAgg ? Math.round(cAgg.avg * 10) / 10 : 0, reviewCount: cAgg?.n ?? 0 } },
    );
  }
}

/** Sales count for a product from paid/COD orders (not cancelled/returned). */
export async function getProductSalesCount(productId: string): Promise<{
  total: number;
  last7: number;
  last30: number;
  totalOrders: number;
}> {
  if (!hasDB() || !OBJECT_ID_RE.test(productId)) return { total: 0, last7: 0, last30: 0, totalOrders: 0 };
  await connectDB();

  const now = new Date();
  const ago7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const ago30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const pipeline = [
    {
      $match: {
        $and: [
          { status: { $nin: ["cancelled", "returned"] } },
          { $or: [{ paymentMethod: "cod" }, { paymentStatus: "paid" }] },
          {
            $or: [
              { "items.refId": productId, "items.kind": "product" },
              { "items.selections.productId": productId },
            ],
          },
        ],
      },
    },
    { $unwind: "$items" },
    {
      $match: {
        $or: [
          { "items.refId": productId, "items.kind": "product" },
          { "items.selections.productId": productId },
        ],
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$items.quantity" },
        totalOrders: { $sum: 1 },
        last7: {
          $sum: {
            $cond: [{ $gte: ["$createdAt", ago7] }, "$items.quantity", 0],
          },
        },
        last30: {
          $sum: {
            $cond: [{ $gte: ["$createdAt", ago30] }, "$items.quantity", 0],
          },
        },
      },
    },
  ];

  const [result] = await OrderModel.aggregate(pipeline);
  return {
    total: result?.total ?? 0,
    last7: result?.last7 ?? 0,
    last30: result?.last30 ?? 0,
    totalOrders: result?.totalOrders ?? 0,
  };
}

export interface ReviewAnalytics {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  averageRating: number;
  verifiedCount: number;
  testimonialCount: number;
  distribution: { star: number; count: number }[];
}

/** Analytics for admin review dashboard. */
export async function getAdminReviewAnalytics(): Promise<ReviewAnalytics> {
  const empty: ReviewAnalytics = {
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    averageRating: 0,
    verifiedCount: 0,
    testimonialCount: 0,
    distribution: [5, 4, 3, 2, 1].map((star) => ({ star, count: 0 })),
  };
  if (!hasDB()) return empty;
  await connectDB();

  const [statusAgg, ratingAgg, verifiedAgg, testimonialAgg] = await Promise.all([
    ReviewModel.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
    ReviewModel.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: "$rating", n: { $sum: 1 } } },
    ]),
    ReviewModel.countDocuments({ verified: true }),
    ReviewModel.countDocuments({ source: "store_testimonial" }),
  ]);

  const byStatus = new Map<string, number>(statusAgg.map((a: any) => [a._id, a.n]));
  const byStar = new Map<number, number>(ratingAgg.map((a: any) => [a._id, a.n]));
  const total = [...byStatus.values()].reduce((a, b) => a + b, 0);
  const approved = byStatus.get("approved") ?? 0;

  // Compute average from distribution
  let ratingSum = 0;
  let ratingCount = 0;
  for (const [star, n] of byStar.entries()) {
    ratingSum += star * n;
    ratingCount += n;
  }

  return {
    total,
    approved,
    pending: byStatus.get("pending") ?? 0,
    rejected: byStatus.get("rejected") ?? 0,
    averageRating: ratingCount ? Math.round((ratingSum / ratingCount) * 10) / 10 : 0,
    verifiedCount: verifiedAgg,
    testimonialCount: testimonialAgg,
    distribution: [5, 4, 3, 2, 1].map((star) => ({ star, count: byStar.get(star) ?? 0 })),
  };
}
