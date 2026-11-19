import type { Session } from "next-auth";
import { AuditLogModel } from "@/models/AuditLog";

/**
 * Record an admin action. Never throws: a logging failure must not roll back
 * or fail the action the admin just performed.
 */
export async function logAdminAction(
  session: Session,
  action: string,
  entity: string,
  entityId: string,
  summary: string,
): Promise<void> {
  try {
    await AuditLogModel.create({
      actorId: session.user.userId,
      actorEmail: session.user.email ?? "unknown",
      action,
      entity,
      entityId,
      summary: summary.slice(0, 300),
    });
  } catch (err) {
    console.error("[audit] failed to write log", err);
  }
}
