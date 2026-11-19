import { getAnalytics } from "@/services/analytics";
import { AnalyticsClient } from "@/components/admin/analytics-client";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const { days: raw } = await searchParams;
  const days = [7, 30, 90].includes(Number(raw)) ? Number(raw) : 30;
  return <AnalyticsClient data={await getAnalytics(days)} />;
}
