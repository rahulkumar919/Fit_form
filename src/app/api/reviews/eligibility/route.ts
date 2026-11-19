/** GET /api/reviews/eligibility?productId= — can the signed-in customer review this product? */

import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { ok, serverError } from "@/lib/api/response";
import { extractUserId } from "@/lib/api/auth-guard";
import { checkEligibility } from "@/services/reviews";
import { hasDB } from "@/lib/db/mongoose";

export async function GET(req: NextRequest) {
  try {
    const productId = new URL(req.url).searchParams.get("productId") ?? "";
    const session = await auth();
    if (!session?.user) return ok({ canReview: false, reason: "not_signed_in" });
    if (session.user.role !== "customer" || !hasDB()) return ok({ canReview: false, reason: "not_purchased" });
    const e = await checkEligibility(extractUserId(session), productId);
    return ok(e.canReview ? { canReview: true } : e);
  } catch (err) {
    return serverError(err);
  }
}
