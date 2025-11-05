"use server";

import { db } from "@/db/drizzle";
import { roles, permissions, rolePermissions, userRoles, user } from "@/db/schema";
import { verifySession } from "@/lib/dal";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { eq, and, inArray, sql, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

/**
 * Server Actions - Gestion des Rôles
 *
 * Toutes les actions sont protégées par permissions granulaires :
 * - roles:create
 * - roles:update
 * - roles:delete
 */

// ============================================
// TYPES
// ============================================

export interface Role {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

export interface RoleWithMembers extends Role {
  members: RoleMember[];
  memberCount: number;
}

export interface Permission {
  id: string;
  name: string;
  description: string | null;
  resource: string;
  action: string;
}

export interface RoleMember {
  userId: string;
  userName: string;
  userEmail: string;
  userImage: string | null;
  assignedAt: Date;
}

// ============================================
// LISTE & RÉCUPÉRATION
// ============================================

/**
 * Liste tous les rôles (triés par priority desc)
 */
export async function listRoles(): Promise<Role[]> {
  const session = await verifySession();

  const allRoles = await db
    .select()
    .from(roles)
    .orderBy(desc(roles.priority));

  return allRoles;
}

/**
 * Récupère un rôle par ID avec ses permissions
 */
export async function getRoleById(roleId: string): Promise<RoleWithPermissions | null> {
  const session = await verifySession();

  const role = await db.query.roles.findFirst({
    where: eq(roles.id, roleId),
  });

  if (!role) return null;

  // Récupérer les permissions du rôle
  const rolePerms = await db
    .select({
      id: permissions.id,
      name: permissions.name,
      description: permissions.description,
      resource: permissions.resource,
      action: permissions.action,
    })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.roleId, roleId));

  return {
    ...role,
    permissions: rolePerms,
  };
}

/**
 * Récupère tous les membres d'un rôle
 */
export async function getRoleMembers(roleId: string): Promise<RoleMember[]> {
  const session = await verifySession();

  const members = await db
    .select({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userImage: user.image,
      assignedAt: userRoles.assignedAt,
    })
    .from(userRoles)
    .innerJoin(user, eq(userRoles.userId, user.id))
    .where(eq(userRoles.roleId, roleId))
    .orderBy(desc(userRoles.assignedAt));

  return members;
}

/**
 * Récupère toutes les permissions disponibles (groupées par resource)
 */
export async function getAllPermissions(): Promise<Permission[]> {
  const session = await verifySession();

  const allPermissions = await db
    .select()
    .from(permissions)
    .orderBy(permissions.resource, permissions.action);

  return allPermissions;
}

// ============================================
// CRÉATION
// ============================================

export interface CreateRoleInput {
  name: string;
  description?: string;
  color?: string;
  priority?: number;
  permissionIds?: string[];
}

/**
 * Crée un nouveau rôle
 */
export async function createRole(input: CreateRoleInput): Promise<{ success: boolean; roleId?: string; error?: string }> {
  try {
    const session = await verifySession();
    await requirePermission(session.user.id, "roles:create");

    // Vérifier que le nom n'existe pas déjà
    const existingRole = await db.query.roles.findFirst({
      where: eq(roles.name, input.name),
    });

    if (existingRole) {
      return { success: false, error: "Un rôle avec ce nom existe déjà" };
    }

    const roleId = nanoid();

    // Créer le rôle
    await db.insert(roles).values({
      id: roleId,
      name: input.name,
      description: input.description || null,
      color: input.color || "#6366f1",
      priority: input.priority || 0,
    });

    // Assigner les permissions si fournies
    if (input.permissionIds && input.permissionIds.length > 0) {
      await db.insert(rolePermissions).values(
        input.permissionIds.map((permId) => ({
          roleId,
          permissionId: permId,
        }))
      );
    }

    // Audit log
    await logAudit({
      userId: session.user.id,
      action: "create",
      resource: "role",
      resourceId: roleId,
      metadata: { roleName: input.name, permissionCount: input.permissionIds?.length || 0 },
    });

    revalidatePath("/roles");
    return { success: true, roleId };
  } catch (error) {
    console.error("Error creating role:", error);
    return { success: false, error: "Erreur lors de la création du rôle" };
  }
}

// ============================================
// MISE À JOUR
// ============================================

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  color?: string;
  priority?: number;
}

/**
 * Met à jour les informations d'un rôle (nom, description, couleur, priority)
 */
export async function updateRole(
  roleId: string,
  input: UpdateRoleInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await verifySession();
    await requirePermission(session.user.id, "roles:update");

    // Vérifier que le rôle existe
    const existingRole = await db.query.roles.findFirst({
      where: eq(roles.id, roleId),
    });

    if (!existingRole) {
      return { success: false, error: "Rôle introuvable" };
    }

    // Si changement de nom, vérifier qu'il n'existe pas déjà
    if (input.name && input.name !== existingRole.name) {
      const duplicate = await db.query.roles.findFirst({
        where: eq(roles.name, input.name),
      });

      if (duplicate) {
        return { success: false, error: "Un rôle avec ce nom existe déjà" };
      }
    }

    // Mettre à jour
    await db
      .update(roles)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(roles.id, roleId));

    // Audit log
    await logAudit({
      userId: session.user.id,
      action: "update",
      resource: "role",
      resourceId: roleId,
      metadata: { roleName: existingRole.name, changes: input },
    });

    revalidatePath("/roles");
    revalidatePath(`/roles/${roleId}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating role:", error);
    return { success: false, error: "Erreur lors de la mise à jour du rôle" };
  }
}

/**
 * Met à jour les permissions d'un rôle
 */
export async function updateRolePermissions(
  roleId: string,
  permissionIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await verifySession();
    await requirePermission(session.user.id, "roles:update");

    // Supprimer toutes les permissions actuelles
    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));

    // Ajouter les nouvelles permissions
    if (permissionIds.length > 0) {
      await db.insert(rolePermissions).values(
        permissionIds.map((permId) => ({
          roleId,
          permissionId: permId,
        }))
      );
    }

    // Audit log
    await logAudit({
      userId: session.user.id,
      action: "update",
      resource: "role",
      resourceId: roleId,
      metadata: { action: "permissions_updated", permissionCount: permissionIds.length },
    });

    revalidatePath("/roles");
    revalidatePath(`/roles/${roleId}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating role permissions:", error);
    return { success: false, error: "Erreur lors de la mise à jour des permissions" };
  }
}

// ============================================
// SUPPRESSION
// ============================================

/**
 * Compte le nombre d'utilisateurs ayant un rôle
 */
export async function countRoleMembers(roleId: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(userRoles)
    .where(eq(userRoles.roleId, roleId));

  return Number(result[0]?.count || 0);
}

/**
 * Supprime un rôle (avec retrait des users + assignation au rôle "Membre")
 */
export async function deleteRole(roleId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await verifySession();
    await requirePermission(session.user.id, "roles:delete");

    // Vérifier que le rôle existe
    const role = await db.query.roles.findFirst({
      where: eq(roles.id, roleId),
    });

    if (!role) {
      return { success: false, error: "Rôle introuvable" };
    }

    // Compter les membres
    const memberCount = await countRoleMembers(roleId);

    // Récupérer le rôle "Membre" pour réassignation
    const membreRole = await db.query.roles.findFirst({
      where: eq(roles.name, "Membre"),
    });

    if (!membreRole) {
      return { success: false, error: "Rôle 'Membre' introuvable (requis pour réassignation)" };
    }

    // Récupérer tous les users qui ont ce rôle
    const affectedUsers = await db
      .select({ userId: userRoles.userId })
      .from(userRoles)
      .where(eq(userRoles.roleId, roleId));

    // Supprimer le rôle de tous les users
    await db.delete(userRoles).where(eq(userRoles.roleId, roleId));

    // Pour chaque user affecté, vérifier s'il a d'autres rôles
    // Si non, lui assigner le rôle "Membre"
    for (const { userId } of affectedUsers) {
      const remainingRoles = await db
        .select()
        .from(userRoles)
        .where(eq(userRoles.userId, userId));

      if (remainingRoles.length === 0) {
        // Assigner le rôle "Membre"
        await db.insert(userRoles).values({
          userId,
          roleId: membreRole.id,
          assignedBy: session.user.id,
        });
      }
    }

    // Supprimer le rôle (cascade delete sur rolePermissions grâce au schema)
    await db.delete(roles).where(eq(roles.id, roleId));

    // Audit log
    await logAudit({
      userId: session.user.id,
      action: "delete",
      resource: "role",
      resourceId: roleId,
      metadata: { roleName: role.name, affectedUsers: affectedUsers.length },
    });

    revalidatePath("/roles");
    return { success: true };
  } catch (error) {
    console.error("Error deleting role:", error);
    return { success: false, error: "Erreur lors de la suppression du rôle" };
  }
}

// ============================================
// GESTION DES MEMBRES
// ============================================

/**
 * Retire un utilisateur d'un rôle (et lui assigne "Membre" si c'était son dernier rôle)
 */
export async function removeUserFromRole(
  userId: string,
  roleId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await verifySession();
    await requirePermission(session.user.id, "roles:update");

    const assignment = await db.query.userRoles.findFirst({
      where: and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)),
    });

    if (!assignment) {
      return { success: false, error: "Cet utilisateur n'a pas ce rôle" };
    }

    // Supprimer le rôle
    const deleteResult = await db
      .delete(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)));


    // Vérifier si l'user a d'autres rôles
    const remainingRoles = await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.userId, userId));


    // Si aucun rôle restant, assigner "Membre"
    if (remainingRoles.length === 0) {
      const membreRole = await db.query.roles.findFirst({
        where: eq(roles.name, "Membre"),
      });

      if (membreRole) {
        await db.insert(userRoles).values({
          userId,
          roleId: membreRole.id,
          assignedBy: session.user.id,
        });
      }
    }

    // Audit log
    await logAudit({
      userId: session.user.id,
      action: "remove",
      resource: "role",
      resourceId: roleId,
      metadata: { targetUserId: userId, action: "removed_from_role" },
    });

    // Revalider le cache Next.js de manière plus agressive
    revalidatePath(`/roles/${roleId}`, 'page');
    revalidatePath('/roles', 'page');

    return { success: true };
  } catch (error) {
    console.error("Error removing user from role:", error);
    return { success: false, error: "Erreur lors du retrait de l'utilisateur" };
  }
}
