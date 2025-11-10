import { db } from "@/db/drizzle";
import { auditLogs } from "@/db/schema";
import { nanoid } from "nanoid";

/**
 * Audit Logging - Traçabilité des actions sensibles
 *
 * Enregistre toutes les actions critiques (CRUD roles, ban users, etc.)
 * pour avoir un audit trail complet.
 *
 * 📝 GUIDE POUR AJOUTER UNE NOUVELLE RESSOURCE OU ACTION :
 *
 * 1️⃣ Ajouter le type dans AuditAction ou AuditResource ci-dessous
 * 2️⃣ Mettre à jour les permissions dans /db/seed.ts (section PERMISSIONS_BASE)
 * 3️⃣ Ajouter les jointures dans /server/audit.ts (fonction listAuditLogs)
 * 4️⃣ Ajouter les couleurs de badges dans /components/logs/audit-logs-table.tsx
 * 5️⃣ Utiliser logAudit() dans vos server actions
 */

/**
 * Types d'actions possibles dans l'audit log
 *
 * 📝 AJOUTER ICI LES NOUVELLES ACTIONS :
 * Exemples : "validate", "publish", "reject", "archive", "restore", etc.
 */
export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "ban"
  | "unban"
  | "assign"
  | "remove";
  // 📝 Ajouter les nouvelles actions ici :
  // | "validate"
  // | "publish"
  // | "reject"
  // | "archive"
  // | "restore";

/**
 * Types de ressources possibles dans l'audit log
 *
 * 📝 AJOUTER ICI LES NOUVELLES RESSOURCES :
 * Exemples : "course", "exercise", "exam", etc.
 */
export type AuditResource =
  | "role"
  | "permission"
  | "user"
  | "member"
  | "event"
  | "resource"
  | "task"
  | "feedback";
  // 📝 Ajouter les nouvelles ressources ici :
  // | "course"
  // | "exercise"
  // | "exam"
  // | "chapter";

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
 * ⚠️ IMPORTANT : Appeler cette fonction dans TOUTES les server actions qui :
 * - Créent, modifient ou suppriment des données sensibles
 * - Changent des permissions ou des rôles
 * - Affectent d'autres utilisateurs
 *
 * 💡 ASTUCE : Utiliser getAuditContext() pour récupérer automatiquement l'IP et le user-agent
 *
 * @param userId - ID de l'utilisateur qui effectue l'action
 * @param action - Type d'action (create, update, delete, etc.)
 * @param resource - Type de ressource affectée (user, role, event, etc.)
 * @param resourceId - ID de la ressource affectée (optionnel)
 * @param metadata - Données additionnelles utiles pour l'audit (optionnel)
 * @param ipAddress - Adresse IP (optionnel, utiliser getAuditContext())
 * @param userAgent - User-Agent du navigateur (optionnel, utiliser getAuditContext())
 *
 * @example
 * // Exemple simple
 * await logAudit({
 *   userId: session.user.id,
 *   action: "delete",
 *   resource: "role",
 *   resourceId: roleId,
 *   metadata: { roleName: "Moderateur", affectedUsers: 5 }
 * });
 *
 * @example
 * // Exemple avec IP et user-agent
 * const auditContext = getAuditContext(await headers());
 * await logAudit({
 *   userId: session.user.id,
 *   action: "ban",
 *   resource: "user",
 *   resourceId: targetUserId,
 *   metadata: { reason: "Violation des règles" },
 *   ...auditContext
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
