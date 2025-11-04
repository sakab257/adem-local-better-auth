import { cache } from "react";
import { db } from "@/db/drizzle";
import { user, roles, permissions, userRoles, rolePermissions } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";

/**
 * Policy Layer - RBAC (Role-Based Access Control)
 *
 * Fonctions pour vérifier les rôles et permissions des utilisateurs
 * Utilisé dans :
 * - Server actions (requireRole, requirePermission)
 * - Middleware (protection routes par rôle)
 * - UI (afficher/masquer des éléments selon permissions)
 */

// ============================================
// TYPES
// ============================================

export type RoleName =
  | "Admin"
  | "Moderateur"
  | "Bureau"
  | "CA"
  | "SuperCorrecteur"
  | "Correcteur"
  | "Membre";

export type UserWithRoles = {
  id: string;
  name: string;
  email: string;
  roles: Array<{
    id: string;
    name: string;
    priority: number;
  }>;
  permissions: string[];
};

// ============================================
// FONCTIONS DE BASE
// ============================================

/**
 * Récupérer tous les rôles d'un utilisateur
 * Cached pour éviter les requêtes répétées
 */
export const getUserRoles = cache(async (userId: string) => {
  const result = await db
    .select({
      id: roles.id,
      name: roles.name,
      priority: roles.priority,
      color: roles.color,
    })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId));

  return result;
});

/**
 * Récupérer toutes les permissions d'un utilisateur
 * (via ses rôles)
 * Cached pour éviter les requêtes répétées
 */
export const getUserPermissions = cache(async (userId: string) => {
  const userRolesList = await getUserRoles(userId);

  if (userRolesList.length === 0) {
    return [];
  }

  const roleIds = userRolesList.map((r) => r.id);

  const result = await db
    .select({
      name: permissions.name,
      resource: permissions.resource,
      action: permissions.action,
    })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(inArray(rolePermissions.roleId, roleIds));

  // Dédupliquer (un user peut avoir la même permission via plusieurs rôles)
  const uniquePermissions = Array.from(
    new Set(result.map((p) => p.name))
  );

  return uniquePermissions;
});

/**
 * Récupérer un utilisateur avec tous ses rôles et permissions
 * Utile pour les server actions qui ont besoin du contexte complet
 */
export const getUserWithRoles = cache(
  async (userId: string): Promise<UserWithRoles | null> => {
    const userRecord = await db.query.user.findFirst({
      where: eq(user.id, userId),
    });

    if (!userRecord) {
      return null;
    }

    const userRolesList = await getUserRoles(userId);
    const userPermissions = await getUserPermissions(userId);

    return {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      roles: userRolesList,
      permissions: userPermissions,
    };
  }
);

// ============================================
// GUARDS - Vérification Rôles & Permissions
// ============================================

/**
 * Vérifier si un utilisateur a un rôle spécifique
 *
 * @example
 * const isAdmin = await hasRole(userId, "Admin");
 * if (!isAdmin) throw new Error("Accès refusé");
 */
export async function hasRole(
  userId: string,
  roleName: RoleName
): Promise<boolean> {
  const userRolesList = await getUserRoles(userId);
  return userRolesList.some((r) => r.name === roleName);
}

/**
 * Vérifier si un utilisateur a au moins un des rôles donnés
 *
 * @example
 * const canManageEvents = await hasAnyRole(userId, ["Admin", "Bureau", "CA"]);
 */
export async function hasAnyRole(
  userId: string,
  roleNames: RoleName[]
): Promise<boolean> {
  const userRolesList = await getUserRoles(userId);
  return userRolesList.some((r) => roleNames.includes(r.name as RoleName));
}

/**
 * Vérifier si un utilisateur a une permission spécifique
 *
 * @example
 * const canCreateEvents = await can(userId, "events:create");
 * if (!canCreateEvents) throw new Error("Permission refusée");
 */
export async function can(
  userId: string,
  permissionName: string
): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId);
  return userPermissions.includes(permissionName);
}

/**
 * Vérifier si un utilisateur a au moins une des permissions données
 *
 * @example
 * const canModerate = await canAny(userId, ["members:ban", "members:update"]);
 */
export async function canAny(
  userId: string,
  permissionNames: string[]
): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId);
  return permissionNames.some((p) => userPermissions.includes(p));
}

/**
 * Vérifier si un utilisateur a toutes les permissions données
 *
 * @example
 * const canFullyManage = await canAll(userId, ["events:create", "events:delete"]);
 */
export async function canAll(
  userId: string,
  permissionNames: string[]
): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId);
  return permissionNames.every((p) => userPermissions.includes(p));
}

// ============================================
// GUARDS AVANCÉS - Server Actions
// ============================================

/**
 * Guard pour server actions : Require un rôle spécifique
 * Throw une erreur si l'utilisateur n'a pas le rôle
 *
 * @example
 * export async function deleteEvent(eventId: string) {
 *   const session = await verifySession();
 *   await requireRole(session.user.id, "Admin");
 *
 *   // Action réservée aux Admins
 *   await db.delete(events).where(eq(events.id, eventId));
 * }
 */
export async function requireRole(
  userId: string,
  roleName: RoleName
): Promise<void> {
  const hasRequiredRole = await hasRole(userId, roleName);

  if (!hasRequiredRole) {
    throw new Error(
      `Accès refusé : rôle "${roleName}" requis`
    );
  }
}

/**
 * Guard pour server actions : Require au moins un des rôles donnés
 *
 * @example
 * export async function createEvent(data: EventInput) {
 *   const session = await verifySession();
 *   await requireAnyRole(session.user.id, ["Admin", "Bureau", "CA"]);
 *
 *   await db.insert(events).values(data);
 * }
 */
export async function requireAnyRole(
  userId: string,
  roleNames: RoleName[]
): Promise<void> {
  const hasRequiredRole = await hasAnyRole(userId, roleNames);

  if (!hasRequiredRole) {
    throw new Error(
      `Accès refusé : un des rôles suivants est requis : ${roleNames.join(", ")}`
    );
  }
}

/**
 * Guard pour server actions : Require une permission spécifique
 *
 * @example
 * export async function banUser(targetUserId: string) {
 *   const session = await verifySession();
 *   await requirePermission(session.user.id, "members:ban");
 *
 *   await authClient.admin.banUser({ userId: targetUserId });
 * }
 */
export async function requirePermission(
  userId: string,
  permissionName: string
): Promise<void> {
  const hasPermission = await can(userId, permissionName);

  if (!hasPermission) {
    throw new Error(
      `Accès refusé : permission "${permissionName}" requise`
    );
  }
}

/**
 * Guard pour server actions : Require au moins une des permissions données
 */
export async function requireAnyPermission(
  userId: string,
  permissionNames: string[]
): Promise<void> {
  const hasPermission = await canAny(userId, permissionNames);

  if (!hasPermission) {
    throw new Error(
      `Accès refusé : une des permissions suivantes est requise : ${permissionNames.join(", ")}`
    );
  }
}

/**
 * Guard pour server actions : Require toutes les permissions données
 */
export async function requireAllPermissions(
  userId: string,
  permissionNames: string[]
): Promise<void> {
  const hasAllPermissions = await canAll(userId, permissionNames);

  if (!hasAllPermissions) {
    throw new Error(
      `Accès refusé : toutes les permissions suivantes sont requises : ${permissionNames.join(", ")}`
    );
  }
}

// ============================================
// UTILITAIRES
// ============================================

/**
 * Récupérer le rôle avec la plus haute priorité
 * Utile pour afficher le rôle principal d'un user
 *
 * @example
 * const primaryRole = await getPrimaryRole(userId);
 * console.log(`Rôle principal : ${primaryRole?.name}`);
 */
export async function getPrimaryRole(userId: string) {
  const userRolesList = await getUserRoles(userId);

  if (userRolesList.length === 0) {
    return null;
  }

  // Trier par priorité décroissante et prendre le premier
  return userRolesList.sort((a, b) => b.priority - a.priority)[0];
}

/**
 * Vérifier si un user est admin
 * Raccourci pratique pour hasRole(userId, "Admin")
 */
export async function isAdmin(userId: string): Promise<boolean> {
  return hasRole(userId, "Admin");
}

/**
 * Vérifier si un user peut modérer (Admin ou Moderateur)
 */
export async function isModerator(userId: string): Promise<boolean> {
  return hasAnyRole(userId, ["Admin", "Moderateur"]);
}

/**
 * Vérifier si un user fait partie du bureau/CA
 */
export async function isBureauOrCA(userId: string): Promise<boolean> {
  return hasAnyRole(userId, ["Admin", "Bureau", "CA"]);
}
