/** PATCH /api/admin/users/[id] — enable/disable an admin or set a new password (admin only). */

import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongoose";
import { AdminUserModel } from "@/models/AdminUser";
import { badRequest, notFound, ok, serverError, zodError } from "@/lib/api/response";
import { extractUserId, requireAdmin } from "@/lib/api/auth-guard";
import { logAdminAction } from "@/lib/audit";
import { BCRYPT_COST } from "@/lib/auth/admin-credentials";
import { OBJECT_ID_RE } from "@/lib/catalog-constants";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
  isActive: z.boolean().optional(),
  password: z.string().min(12, "Password must be at least 12 characters").max(200).optional(),
}).refine((v) => v.isActive !== undefined || v.password !== undefined, "Nothing to change");

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;
    const { id } = await params;
    if (!OBJECT_ID_RE.test(id)) return notFound("Admin not found");
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return zodError(parsed.error);

    await connectDB();
    const user = await AdminUserModel.findById(id);
    if (!user) return notFound("Admin not found");

    if (parsed.data.isActive === false) {
      if (id === extractUserId(session!)) return badRequest("You cannot disable your own account");
      const othersActive = await AdminUserModel.countDocuments({ _id: { $ne: id }, isActive: true });
      if (othersActive === 0) return badRequest("At least one active admin is required");
    }
    if (parsed.data.isActive !== undefined) user.isActive = parsed.data.isActive;
    if (parsed.data.password) {
      user.passwordHash = await bcrypt.hash(parsed.data.password, BCRYPT_COST);
      user.failedAttempts = 0;
      user.lockUntil = null;
    }
    await user.save();
    await logAdminAction(session!, parsed.data.password ? "admin.password" : "admin.status", "admin", id,
      parsed.data.password ? `Changed password for ${user.email}` : `${user.isActive ? "Enabled" : "Disabled"} ${user.email}`);
    return ok({ id });
  } catch (err) {
    return serverError(err);
  }
}
