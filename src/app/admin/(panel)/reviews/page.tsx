import { getAdminReviews } from "@/services/admin";
import { getAdminReviewAnalytics } from "@/services/reviews";
import { ReviewsManager } from "@/components/admin/reviews-manager";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const [reviews, analytics] = await Promise.all([
    getAdminReviews(),
    getAdminReviewAnalytics(),
  ]);
  return <ReviewsManager reviews={reviews} initialAnalytics={analytics} />;
}
