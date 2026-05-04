import { db } from "@/lib/db/client";
import { auditLog } from "@/lib/db/schema";
import { logger } from "@/lib/logger";

export type AuditEvent = {
  userId?: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  ip?: string;
  ua?: string;
};

/**
 * Record a mutating action. Best-effort: failures are logged but never
 * thrown (we don't want auditing to break the user-facing operation).
 */
export async function audit(event: AuditEvent): Promise<void> {
  try {
    await db.insert(auditLog).values({
      userId: event.userId ?? null,
      action: event.action,
      targetType: event.targetType,
      targetId: event.targetId,
      ip: event.ip,
      ua: event.ua,
    });
  } catch (err) {
    logger.error({ err, event }, "audit insert failed");
  }
}
