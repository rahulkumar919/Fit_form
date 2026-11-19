/** GET /api/admin/dashboard — dashboard KPIs and series (admin only) */

import { ok, serverError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/api/auth-guard";
import { getDashboardData } from "@/services/admin";

export async function GET() {
  try {
    const { error } = await requireAdmin();
    if (error) return error;
    return ok(await getDashboardData());
  } catch (err) {
    return serverError(err);
  }
}
