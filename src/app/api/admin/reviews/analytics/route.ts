/**
 * GET /api/admin/reviews/analytics
 * Returns aggregated review statistics for the admin dashboard.
 */

import { ok, serverError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/api/auth-guard";
import { getAdminReviewAnalytics } from "@/services/reviews";

export async function GET() {
  try {
    const { error } = await requireAdmin();
    if (error) return error;
    const data = await getAdminReviewAnalytics();
    return ok(data);
  } catch (err) {
    return serverError(err);
  }
}
