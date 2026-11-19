/** GET /api/admin/customers — list customers with order stats (admin only) */

import { ok, serverError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/api/auth-guard";
import { getAdminCustomers } from "@/services/admin";

export async function GET() {
  try {
    const { error } = await requireAdmin();
    if (error) return error;
    return ok(await getAdminCustomers());
  } catch (err) {
    return serverError(err);
  }
}
