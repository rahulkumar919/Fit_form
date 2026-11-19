/**
 * Admin email + password verification.
 *
 * Security properties:
 *  - passwords are bcrypt hashes (cost 12), never stored in plain text
 *  - a dummy bcrypt compare runs when the email is unknown, so response
 *    time does not reveal which emails exist
 *  - 5 wrong attempts lock the account for 15 minutes
 *  - callers get one generic failure, never "user not found" vs "bad password"
 */

import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongoose";
import { AdminUserModel } from "@/models/AdminUser";

export const MAX_FAILED_ATTEMPTS = 5;
export const LOCK_MINUTES = 15;
export const BCRYPT_COST = 12;

// A real hash of a random string, computed once, used only to burn equal CPU time.
let dummyHashPromise: Promise<string> | null = null;
function getDummyHash(): Promise<string> {
  dummyHashPromise ??= bcrypt.hash(`dummy-${Math.random()}-${Date.now()}`, BCRYPT_COST);
  return dummyHashPromise;
}
async function burnTime(password: string) {
  await bcrypt.compare(password, await getDummyHash());
}

export const adminLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(200),
});

export interface VerifiedAdmin {
  id: string;
  name: string;
  email: string;
}

export async function verifyAdminCredentials(raw: unknown): Promise<VerifiedAdmin | null> {
  const parsed = adminLoginSchema.safeParse(raw);
  if (!parsed.success) return null;
  const { email, password } = parsed.data;

  await connectDB();
  const admin = await AdminUserModel.findOne({ email }).select("+passwordHash");

  if (!admin || !admin.isActive) {
    await burnTime(password);
    return null;
  }

  if (admin.lockUntil && admin.lockUntil > new Date()) {
    await burnTime(password);
    return null;
  }

  const valid = await bcrypt.compare(password, admin.passwordHash);

  if (!valid) {
    admin.failedAttempts += 1;
    if (admin.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      admin.lockUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
      admin.failedAttempts = 0;
    }
    await admin.save();
    return null;
  }

  admin.failedAttempts = 0;
  admin.lockUntil = null;
  admin.lastLoginAt = new Date();
  await admin.save();

  return { id: String(admin._id), name: admin.name, email: admin.email };
}

/** Used on every admin API call so a deactivated admin loses access immediately. */
export async function isAdminStillActive(id: string): Promise<boolean> {
  try {
    await connectDB();
    const admin = await AdminUserModel.findById(id).select("isActive").lean();
    return !!admin && (admin as { isActive: boolean }).isActive;
  } catch {
    return false;
  }
}
