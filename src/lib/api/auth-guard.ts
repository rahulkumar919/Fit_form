/**
 * Server-side route guards.
 */

import { auth } from "@/lib/auth/auth";
import { forbidden, unauthorised } from "./response";
import { isAdminStillActive } from "@/lib/auth/admin-credentials";
import type { Session } from "next-auth";

type MaybeSession = Session | null;

function sessionUser(session: Session) {
  return session.user as Session["user"] & { role?: string; userId?: string; id?: string };
}

export async function getSession(): Promise<MaybeSession> {
  return auth() as Promise<MaybeSession>;
}

export async function requireAuth() { 
  const session = await auth() as MaybeSession;
  if (!session?.user) {
    return { session: null as null, error: unauthorised() };
  }
  return { session, error: null as null };
}

export async function requireAdmin() {
  const session = await auth() as MaybeSession;
  if (!session?.user) {
    return { session: null as null, error: unauthorised() };
  }
  const user = sessionUser(session);
  if (user.role !== "admin") {
    return { session: null as null, error: forbidden("Admin access required") };
  }
  // Re-check the database so a deactivated admin loses access immediately.
  if (process.env.MONGODB_URI && !(await isAdminStillActive(extractUserId(session)))) {
    return { session: null as null, error: forbidden("Admin account is disabled") };
  }
  return { session, error: null as null };
}

/** Extract userId string safely from a session. */
export function extractUserId(session: Session): string {
  const u = sessionUser(session);
  return u.userId ?? u.id ?? (u as { sub?: string }).sub ?? "";
}

/** Extract role safely from a session. */
export function extractRole(session: Session): string {
  const u = sessionUser(session);
  return u.role ?? "customer";
}
