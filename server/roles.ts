"use server";

import { db } from "@/db/drizzle";
import { roles, permissions, rolePermissions, userRoles, user } from "@/db/schema";
import { verifySession } from "@/lib/dal";
import { requireAllPermissions, requirePermission } from "@/lib/rbac";
import { ensureUserHasRole } from "@/lib/rbac-utils";
import { logAudit } from "@/lib/audit";
import { eq, and, sql, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { Role, Permission, RoleWithPermissions, RoleWithMembers, RoleMember, CreateRoleInput, UpdateRoleInput, DataResponse } from "@/lib/types";

// ============================================
// FICHIER REFACTORISE AVEC requirePermission / requireAllPermissions
// ============================================

/**
 * Server Actions - Gestion des Rôles
 *
 * Toutes les actions sont protégées par permissions granulaires :
 * - roles:create
 * - roles:update
 * - roles:delete
 * - roles:read
 */

// ============================================
// LISTE & RÉCUPÉRATION
// ============================================

/**
 * Liste tous les rôles (triés par priority desc) REFACTORISE AVEC can(id,permission)
 */
export async function listRoles(): Promise<DataResponse<Role[]>> {
  try {
    const session = await verifySession();
    await requirePermission(session.user.id, "roles:read");

    const allRoles = await db
      .select()
      .from(roles)
      .orderBy(desc(roles.priority));

    return { success: true, data: allRoles };
  } catch (error) {
    console.error("Erreur lors de la récupération des rôles:", error);
    return { success: false, error: "Impossible de récupérer les rôles. Veuillez réessayer." };
  }
}

/**
 * Récupère un rôle par ID avec ses permissions REFACTORISE AVEC can(id,permission)
 */
export async function getRoleById(roleId: string): Promise<DataResponse<RoleWithPermissions | null>> {
  try {
    const session = await verifySession();
    await requirePermission(session.user.id, "roles:read");

    const role = await db.query.roles.findFirst({
      where: eq(roles.id, roleId),
    });

    if (!role) {
      return { success: true, data: null };
    }

    // Récupérer les permissions du rôle
    const rolePerms = await db
      .select({
        id: permissions.id,
        name: permissions.name,
        description: permissions.description,
        resource: permissions.resource,
        action: permissions.action,
        createdAt: permissions.createdAt,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, roleId));

    return {
      success: true,
      data: {
        ...role,
        permissions: rolePerms,
      },
    };
  } catch (error) {
    console.error("Erreur lors de la récupération du rôle:", error);
    return { success: false, error: "Impossible de récupérer le rôle. Veuillez réessayer." };
  }
}

/**
 * Récupère tous les membres d'un rôle REFACTORISE AVEC can(id,permission)
 */
export async function getRoleMembers(roleId: string): Promise<DataResponse<RoleMember[]>> {
  try {
    const session = await verifySession();
    await requirePermission(session.user.id, "roles:read");

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

    return { success: true, data: members };
  } catch (error) {
    console.error("Erreur lors de la récupération des membres du rôle:", error);
    return { success: false, error: "Impossible de récupérer les membres du rôle. Veuillez réessayer." };
  }
}

/**
 * Récupère toutes les permissions disponibles (groupées par resource) REFACTORISE AVEC can(id,permission)
 */
export async function getAllPermissions(): Promise<DataResponse<Permission[]>> {
  try {
    const session = await verifySession();
    await requirePermission(session.user.id, "roles:read");

    const allPermissions = await db
      .select()
      .from(permissions)
      .orderBy(permissions.resource, permissions.action);

    return { success: true, data: allPermissions };
  } catch (error) {
    console.error("Erreur lors de la récupération des permissions:", error);
    return { success: false, error: "Impossible de récupérer les permissions. Veuillez réessayer." };
  }
}

// ============================================
// CRÉATION
// ============================================

/**
 * Crée un nouveau rôle
 *
 * Utilise une transaction DB pour garantir l'atomicité :
 * - Si l'assignation des permissions échoue, le rôle n'est pas créé
 * - Évite les rôles orphelins sans permissions
 */
export async function createRole(input: CreateRoleInput): Promise<{ success: boolean; roleId?: string; error?: string }> {
  try {
    const session = await verifySession();
    await requireAllPermissions(session.user.id, ["roles:read", "roles:create"]);

    // Vérifier que le nom n'existe pas déjà
    const existingRole = await db.query.roles.findFirst({
      where: eq(roles.name, input.name),
    });

    if (existingRole) {
      return { success: false, error: "Un rôle avec ce nom existe déjà" };
    }

    const roleId = nanoid();

    // Transaction atomique : création du rôle + assignation des permissions
    await db.transaction(async (tx) => {
      // 1. Créer le rôle
      await tx.insert(roles).values({
        id: roleId,
        name: input.name,
        description: input.description || null,
        color: input.color || "#6366f1",
        priority: input.priority || 0,
      });

      // 2. Assigner les permissions si fournies
      if (input.permissionIds && input.permissionIds.length > 0) {
        await tx.insert(rolePermissions).values(
          input.permissionIds.map((permId) => ({
            roleId,
            permissionId: permId,
          }))
        );
      }
    });

    // Audit log (hors transaction car non-critique)
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

/**
 * Met à jour les informations d'un rôle (nom, description, couleur, priority)
 */
export async function updateRole(
  roleId: string,
  input: UpdateRoleInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await verifySession();
    await requireAllPermissions(session.user.id, ["roles:read","roles:update"]);

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
 *
 * Utilise une transaction DB pour garantir l'atomicité :
 * - Si l'ajout des nouvelles permissions échoue, les anciennes ne sont pas supprimées
 */
export async function updateRolePermissions(
  roleId: string,
  permissionIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await verifySession();
    await requireAllPermissions(session.user.id, ["roles:read", "roles:update"]);

    // Transaction atomique : suppression + insertion en une seule opération
    await db.transaction(async (tx) => {
      // 1. Supprimer toutes les permissions actuelles
      await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));

      // 2. Ajouter les nouvelles permissions
      if (permissionIds.length > 0) {
        await tx.insert(rolePermissions).values(
          permissionIds.map((permId) => ({
            roleId,
            permissionId: permId,
          }))
        );
      }
    });

    // Audit log (hors transaction car non-critique)
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
export async function countRoleMembers(roleId: string): Promise<DataResponse<number>> {
  try {
    const session = await verifySession();
    await requireAllPermissions(session.user.id, ["roles:read"]);

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(userRoles)
      .where(eq(userRoles.roleId, roleId));

    return { success: true, data: Number(result[0]?.count || 0) };
  } catch (error) {
    console.error("Erreur lors du comptage des membres du rôle:", error);
    return { success: false, error: "Impossible de compter les membres du rôle. Veuillez réessayer." };
  }
}

/**
 * Supprime un rôle (avec retrait des users + assignation au rôle "Membre")
 *
 * Utilise une transaction DB pour garantir l'atomicité :
 * - Si une opération échoue, toutes les modifications sont annulées (rollback)
 * - Évite les états incohérents (users sans rôle, rôle partiellement supprimé)
 */
export async function deleteRole(roleId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await verifySession();
    await requireAllPermissions(session.user.id, ["roles:read", "roles:update"]);

    // Vérifier que le rôle existe
    const role = await db.query.roles.findFirst({
      where: eq(roles.id, roleId),
    });

    if (!role) {
      return { success: false, error: "Rôle introuvable" };
    }

    // Compter les membres
    const memberCountResult = await countRoleMembers(roleId);
    if (!memberCountResult.success) {
      return { success: false, error: memberCountResult.error };
    }

    // Récupérer tous les users qui ont ce rôle
    const affectedUsers = await db
      .select({ userId: userRoles.userId })
      .from(userRoles)
      .where(eq(userRoles.roleId, roleId));

    // Transaction atomique : toutes les opérations réussissent ou toutes échouent
    await db.transaction(async (tx) => {
      // 1. Supprimer le rôle de tous les users
      await tx.delete(userRoles).where(eq(userRoles.roleId, roleId));

      // 2. Pour chaque user affecté, s'assurer qu'il a au moins un rôle
      for (const { userId } of affectedUsers) {
        await ensureUserHasRole(tx, userId, session.user.id);
      }

      // 3. Supprimer le rôle (cascade delete sur rolePermissions grâce au schema)
      await tx.delete(roles).where(eq(roles.id, roleId));
    });

    // Audit log (hors transaction car non-critique)
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
 *
 * Utilise une transaction DB pour garantir l'atomicité :
 * - Si la réassignation du rôle "Membre" échoue, le rôle n'est pas retiré
 * - Évite qu'un utilisateur se retrouve sans aucun rôle
 */
export async function removeUserFromRole(
  userId: string,
  roleId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await verifySession();
    await requireAllPermissions(session.user.id, ["roles:read", "roles:delete", "members:read", "members:update"]);

    const assignment = await db.query.userRoles.findFirst({
      where: and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)),
    });

    if (!assignment) {
      return { success: false, error: "Cet utilisateur n'a pas ce rôle" };
    }

    // Transaction atomique : suppression + réassignation conditionnelle
    await db.transaction(async (tx) => {
      // 1. Supprimer le rôle
      await tx
        .delete(userRoles)
        .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)));

      // 2. S'assurer que l'utilisateur a au moins un rôle
      await ensureUserHasRole(tx, userId, session.user.id);
    });

    // Audit log (hors transaction car non-critique)
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
