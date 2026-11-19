import { auth } from "@/lib/auth/auth";
import { extractUserId } from "@/lib/api/auth-guard";
import { getAdminUsers } from "@/services/admin";
import { AdminUsersManager } from "@/components/admin/admin-users-manager";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await auth();
  return <AdminUsersManager users={await getAdminUsers(session ? extractUserId(session) : "")} />;
}
