/**
 * POST /api/reviews/helpful
 * Body: { reviewId: string }
 * Increments helpfulCount once per session user. Requires authentication.
 * Anonymous visitors cannot vote (prevents trivial inflation).
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB, hasDB } from "@/lib/db/mongoose";
import { ReviewModel } from "@/models/Review";
import { badRequest, conflict, notFound, ok, serverError } from "@/lib/api/response";
import { requireAuth, extractUserId } from "@/lib/api/auth-guard";
import { OBJECT_ID_RE } from "@/lib/catalog-constants";

const schema = z.object({
  reviewId: z.string().regex(OBJECT_ID_RE),
});

export async function POST(req: NextRequest) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;
    if (!hasDB()) return badRequest("Unavailable right now");

    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return badRequest("Invalid request");

    const userId = extractUserId(session!);
    await connectDB();

    // Check if already voted
    const existing = await ReviewModel.findOne({
      _id: parsed.data.reviewId,
      helpfulVoters: userId,
    }).select("_id").lean();
    if (existing) return conflict("You have already marked this review as helpful");

    const review = await ReviewModel.findOneAndUpdate(
      { _id: parsed.data.reviewId, status: "approved" },
      { $inc: { helpfulCount: 1 }, $addToSet: { helpfulVoters: userId } },
      { new: true },
    ).select("helpfulCount").lean();

    if (!review) return notFound("Review not found");
    return ok({ helpfulCount: (review as { helpfulCount: number }).helpfulCount });
  } catch (err) {
    return serverError(err);
  }
}
