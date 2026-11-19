/**
 * PATCH  /api/admin/reviews/[id] — approve / reject / hide / full edit
 * DELETE /api/admin/reviews/[id] — delete a review
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongoose";
import { ReviewModel } from "@/models/Review";
import { notFound, ok, serverError, zodError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/api/auth-guard";
import { logAdminAction } from "@/lib/audit";
import { recomputeRatings } from "@/services/reviews";
import { afterCatalogChange } from "@/lib/catalog-sync";
import { OBJECT_ID_RE } from "@/lib/catalog-constants";

type Ctx = { params: Promise<{ id: string }> };

// Accept either a simple approval toggle (legacy) or a full edit payload
const patchSchema = z.object({
  // Legacy simple toggle
  isApproved: z.boolean().optional(),
  // Status-based moderation
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  // Full edit fields (admin can fix customer name, body, etc.)
  author: z.string().trim().min(1).max(80).optional(),
  customerImage: z.string().trim().max(500).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().trim().max(80).optional(),
  body: z.string().trim().max(1500).optional(),
  images: z.array(z.string().max(500)).max(5).optional(),
  source: z.enum(["customer", "store_testimonial"]).optional(),
  featured: z.boolean().optional(),
}).refine(
  (d) => Object.keys(d).some((k) => d[k as keyof typeof d] !== undefined),
  "At least one field is required",
);

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;
    const { id } = await params;
    if (!OBJECT_ID_RE.test(id)) return notFound("Review not found");

    const body = await req.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return zodError(parsed.error);

    await connectDB();

    // Build the update document
    const $set: Record<string, unknown> = {};

    // Status can be set directly or via legacy isApproved boolean
    if (parsed.data.status !== undefined) {
      $set.status = parsed.data.status;
      $set.isApproved = parsed.data.status === "approved";
    } else if (parsed.data.isApproved !== undefined) {
      $set.isApproved = parsed.data.isApproved;
      $set.status = parsed.data.isApproved ? "approved" : "pending";
    }

    if (parsed.data.author !== undefined) $set.author = parsed.data.author;
    if (parsed.data.customerImage !== undefined) $set.customerImage = parsed.data.customerImage;
    if (parsed.data.rating !== undefined) $set.rating = parsed.data.rating;
    if (parsed.data.title !== undefined) $set.title = parsed.data.title;
    if (parsed.data.body !== undefined) $set.body = parsed.data.body;
    if (parsed.data.images !== undefined) $set.images = parsed.data.images;
    if (parsed.data.featured !== undefined) $set.featured = parsed.data.featured;
    // Admin may reclassify source, but can never make a testimonial appear as verified purchase
    if (parsed.data.source !== undefined) {
      $set.source = parsed.data.source;
      // Store testimonials are never verified purchases
      if (parsed.data.source === "store_testimonial") $set.verified = false;
    }

    const review = await ReviewModel.findByIdAndUpdate(
      id,
      { $set },
      { new: true, runValidators: true },
    );
    if (!review) return notFound("Review not found");

    // Recompute product ratings whenever approval state may have changed
    const affectsRating = parsed.data.status !== undefined || parsed.data.isApproved !== undefined || parsed.data.rating !== undefined;
    if (affectsRating) {
      await recomputeRatings(String(review.productId));
      await afterCatalogChange();
    }

    const action = parsed.data.status === "approved" || parsed.data.isApproved === true
      ? "review.approve"
      : parsed.data.status === "rejected"
        ? "review.reject"
        : "review.edit";
    await logAdminAction(session!, action, "review", id, `Rating ${review.rating} by ${review.author}`);

    return ok({ id, status: review.status, isApproved: review.isApproved });
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;
    const { id } = await params;
    if (!OBJECT_ID_RE.test(id)) return notFound("Review not found");
    await connectDB();
    const review = await ReviewModel.findByIdAndDelete(id);
    if (!review) return notFound("Review not found");
    await recomputeRatings(String(review.productId));
    await afterCatalogChange();
    await logAdminAction(session!, "review.delete", "review", id, `Rating ${review.rating} by ${review.author}`);
    return ok({ id });
  } catch (err) {
    return serverError(err);
  }
}
