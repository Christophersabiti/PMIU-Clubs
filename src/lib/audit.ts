import "server-only";
import { db } from "./db";

export async function audit(actorId: string | null, action: string, entity: string, entityId?: string | null, details?: unknown) {
  await db.auditLog.create({
    data: {
      actorId,
      action,
      entity,
      entityId: entityId ?? null,
      details: details == null ? null : typeof details === "string" ? details : JSON.stringify(details),
    },
  });
}
