/**
 * Utilitaires RBAC pour opérations courantes
 *
 * Ce fichier contient des fonctions réutilisables pour éviter la duplication de code
 * dans les server actions liées à la gestion des rôles
 */

import { db } from "@/db/drizzle";
import { roles, userRoles } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Assure qu'un utilisateur a au moins un rôle
 *
 * Si l'utilisateur n'a aucun rôle, lui assigne automatiquement le rôle "Membre"
 * Utilisé après suppression de rôles pour garantir que chaque user a au moins 1 rôle
 *
 * @param tx - Transaction Drizzle (pour utilisation dans une transaction)
 * @param userId - ID de l'utilisateur à vérifier
 * @param assignedBy - ID de l'utilisateur qui effectue l'assignation
 * @throws Error si le rôle "Membre" n'existe pas en DB
 *
 * @example
 * await db.transaction(async (tx) => {
 *   await tx.delete(userRoles).where(eq(userRoles.userId, userId));
 *   await ensureUserHasRole(tx, userId, session.user.id);
 * });
 */
export async function ensureUserHasRole(
  tx: any, // Type Drizzle transaction
  userId: string,
  assignedBy: string
): Promise<void> {
  // Vérifier si l'utilisateur a des rôles
  const remainingRoles = await tx
    .select()
    .from(userRoles)
    .where(eq(userRoles.userId, userId));

  // Si aucun rôle, assigner "Membre"
  if (remainingRoles.length === 0) {
    const membreRole = await tx.query.roles.findFirst({
      where: eq(roles.name, "Membre"),
    });

    if (!membreRole) {
      throw new Error("Rôle 'Membre' introuvable (requis pour réassignation)");
    }

    await tx.insert(userRoles).values({
      userId,
      roleId: membreRole.id,
      assignedBy,
      assignedAt: new Date(),
    });
  }
}

/**
 * Récupère le rôle "Membre"
 *
 * Fonction utilitaire pour éviter de répéter la requête DB
 *
 * @returns Le rôle "Membre" ou null s'il n'existe pas
 */
export async function getMembreRole() {
  return await db.query.roles.findFirst({
    where: eq(roles.name, "Membre"),
  });
}
