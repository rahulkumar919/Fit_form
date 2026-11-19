/** 
 * GET /api/reviews?productId=&sort=newest&star=0&page=1&limit=10
 * POST /api/reviews — a verified buyer submits a review (shown after admin approval).
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB, hasDB } from "@/lib/db/mongoose";
import { ReviewModel } from "@/models/Review";
import { badRequest, conflict, created, forbidden, ok, serverError, zodError } from "@/lib/api/response";
import { extractUserId, requireAuth } from "@/lib/api/auth-guard";
import { checkEligibility, displayName, getProductReviewsPaginated } from "@/services/reviews";
import { rateLimited } from "@/lib/tracking/record";
import { OBJECT_ID_RE } from "@/lib/catalog-constants";

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl;
    const productId = url.searchParams.get("productId") ?? "";
    if (!OBJECT_ID_RE.test(productId)) return badRequest("Invalid productId");

    const sort = url.searchParams.get("sort") ?? "newest";
    const star = parseInt(url.searchParams.get("star") ?? "0", 10);
    const page = parseInt(url.searchParams.get("page") ?? "1", 10);
    const limit = parseInt(url.searchParams.get("limit") ?? "10", 10);

    const result = await getProductReviewsPaginated(productId, { sort, star, page, limit });
    return ok(result);
  } catch (err) {
    return serverError(err);
  }
}

const schema = z.object({
  productId: z.string().regex(OBJECT_ID_RE),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(80).default(""),
  body: z.string().trim().min(10, "Please write at least 10 characters").max(1500),
});

export async function POST(req: NextRequest) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;
    if (!hasDB()) return badRequest("Reviews are unavailable right now");
    if (session!.user.role !== "customer") return forbidden("Only customers can write reviews");

    const userId = extractUserId(session!);
    if (rateLimited(`review:${userId}`, 5)) return badRequest("Too many attempts. Please wait a minute.");

    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return zodError(parsed.error);

    const elig = await checkEligibility(userId, parsed.data.productId);
    if (!elig.canReview) {
      return elig.reason === "already_reviewed"
        ? conflict("You have already reviewed this product")
        : forbidden("Only customers who received this product can review it");
    }

    await connectDB();
    const review = await ReviewModel.create({
      productId: parsed.data.productId,
      userId,
      orderId: elig.orderId,
      author: displayName(session!.user.name),
      rating: parsed.data.rating,
      title: parsed.data.title,
      body: parsed.data.body,
      verified: true,
      status: "pending",
      isApproved: false,
    });
    return created({ id: String(review._id), status: "pending" });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) return conflict("You have already reviewed this product");
    return serverError(err);
  }
}
