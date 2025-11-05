import { db } from "@/db/drizzle";
import { auditLogs } from "@/db/schema";
import { nanoid } from "nanoid";

/**
 * Audit Logging - Traçabilité des actions sensibles
 *
 * Enregistre toutes les actions critiques (CRUD roles, ban users, etc.)
 * pour avoir un audit trail complet.
 */

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "ban"
  | "unban"
  | "assign"
  | "remove";

export type AuditResource =
  | "role"
  | "permission"
  | "user"
  | "member"
  | "event"
  | "resource"
  | "task"
  | "feedback";

interface LogAuditInput {
  userId: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string | null;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Enregistre une action dans les logs d'audit
 *
 * @example
 * await logAudit({
 *   userId: session.user.id,
 *   action: "delete",
 *   resource: "role",
 *   resourceId: roleId,
 *   metadata: { roleName: "Moderateur", affectedUsers: 5 }
 * });
 */
export async function logAudit({
  userId,
  action,
  resource,
  resourceId,
  metadata,
  ipAddress,
  userAgent,
}: LogAuditInput): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      id: nanoid(),
      userId,
      action,
      resource,
      resourceId,
      metadata: metadata ? JSON.stringify(metadata) : null,
      ipAddress: ipAddress || "unknown",
      userAgent: userAgent || "unknown",
      createdAt: new Date(),
    });
  } catch (error) {
    // Ne pas bloquer l'action si le logging échoue
    console.error("Failed to log audit:", error);
  }
}

/**
 * Helper pour extraire IP et User-Agent depuis les headers Next.js
 */
export function getAuditContext(headers: Headers) {
  return {
    ipAddress: headers.get("x-forwarded-for") || headers.get("x-real-ip") || "unknown",
    userAgent: headers.get("user-agent") || "unknown",
  };
}
