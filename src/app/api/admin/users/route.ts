/** POST /api/admin/users — add an admin account (admin only). */

import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongoose";
import { AdminUserModel } from "@/models/AdminUser";
import { conflict, created, serverError, zodError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/api/auth-guard";
import { logAdminAction } from "@/lib/audit";
import { BCRYPT_COST } from "@/lib/auth/admin-credentials";

const schema = z.object({
  name: z.string().trim().min(2).max(60),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(12, "Password must be at least 12 characters").max(200),
});

export async function POST(req: NextRequest) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return zodError(parsed.error);

    await connectDB();
    if (await AdminUserModel.exists({ email: parsed.data.email })) return conflict("An admin with that email already exists");
    const user = await AdminUserModel.create({
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await bcrypt.hash(parsed.data.password, BCRYPT_COST),
      isActive: true,
    });
    await logAdminAction(session!, "admin.create", "admin", String(user._id), `Added admin ${user.email}`);
    return created({ id: String(user._id) });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) return conflict("An admin with that email already exists");
    return serverError(err);
  }
}
