import { auth } from "@/lib/auth/auth";
import { getDashboardData } from "@/services/admin";
import { DashboardClient } from "@/components/admin/dashboard-client";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [session, data] = await Promise.all([auth(), getDashboardData()]);
  return <DashboardClient data={data} adminName={session?.user?.name ?? "Admin"} />;
}
