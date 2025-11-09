"use server";

import { verifySession } from "@/lib/dal";
import {
  getUserRoles,
  requireCanManageUser,
  requirePermission,
  requireAllPermissions,
  canManageUser,
  getUserMaxPriority
} from "@/lib/rbac";
import { ensureUserHasRole } from "@/lib/rbac-utils";
import { db } from "@/db/drizzle";
import { user, userRoles, roles, account } from "@/db/schema";
import { eq, and, or, like, desc, asc, count, lt } from "drizzle-orm";
import { nanoid } from "nanoid";
import { logAudit, getAuditContext } from "@/lib/audit";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import {
  UserWithRoles,
  ListUsersFilters,
  ListUsersResponse,
  ActionResponse,
  UserStatus,
  DataResponse,
  CreateMemberInput,
} from "@/lib/types";
import { CreateMemberFormData, CreateMemberSchema } from "@/lib/validations/member";
import { generateSecurePassword } from "@/lib/utils";
import { sendWelcomeEmail } from "@/lib/email";

// ============================================
// FICHIER REFACTORISE AVEC requirePermission / requireAllPermissions
// ============================================

// ============================================
// RÉCUPÉRER TOUS LES RÔLES DISPONIBLES
// ============================================

type RoleData = { id: string; name: string; color: string | null; priority: number };

export async function getAllRoles(): Promise<DataResponse<RoleData[]>> {
  try {
    const session = await verifySession();
    // Lecture uniquement : 1 seule permission
    await requirePermission(session.user.id, "members:read");

    const allRoles = await db
      .select({
        id: roles.id,
        name: roles.name,
        color: roles.color,
        priority: roles.priority,
      })
      .from(roles)
      .orderBy(desc(roles.priority));

    return { success: true, data: allRoles };
  } catch (error) {
    console.error("Erreur lors de la récupération des rôles:", error);
    return {
      success: false,
      error: "Impossible de récupérer les rôles. Veuillez réessayer.",
    };
  }
}

// ============================================
// RÉCUPÉRER LES RÔLES GÉRABLES PAR L'UTILISATEUR COURANT
// ============================================

/**
 * Retourne tous les rôles que l'utilisateur courant peut assigner à d'autres utilisateurs
 * en fonction de sa hiérarchie (priorité max)
 *
 * Règle : Un utilisateur peut assigner uniquement les rôles qui ont une priorité
 * strictement inférieure à sa propre priorité maximale
 *
 * @example
 * // Si l'utilisateur a le rôle "Moderateur" (priority=80)
 * // Il pourra gérer : Bureau (70), CA (70), SuperCorrecteur (60), etc.
 * // Mais PAS : Admin (100), Moderateur (80)
 */
export async function getManageableRoles(): Promise<DataResponse<RoleData[]>> {
  try {
    const session = await verifySession();
    // Lecture uniquement : 1 seule permission
    await requirePermission(session.user.id, "members:read");

    // Récupérer la priorité maximale de l'utilisateur courant
    const currentUserMaxPriority = await getUserMaxPriority(session.user.id);

    // Récupérer tous les rôles avec une priorité STRICTEMENT inférieure
    const manageableRoles = await db
      .select({
        id: roles.id,
        name: roles.name,
        color: roles.color,
        priority: roles.priority,
      })
      .from(roles)
      .where(lt(roles.priority, currentUserMaxPriority))
      .orderBy(desc(roles.priority));

    return { success: true, data: manageableRoles };
  } catch (error) {
    console.error("Erreur lors de la récupération des rôles gérables:", error);
    return {
      success: false,
      error: "Impossible de récupérer les rôles gérables. Veuillez réessayer.",
    };
  }
}

// ============================================
// VÉRIFIER SI L'UTILISATEUR COURANT PEUT GÉRER UN AUTRE USER
// ============================================

export async function canManageUserAction(
  targetUserId: string
): Promise<{ canManage: boolean }> {
  try {
    const session = await verifySession();
    // Lecture uniquement : 1 seule permission
    await requirePermission(session.user.id, "members:read");

    const result = await canManageUser(session.user.id, targetUserId);
    return { canManage: result };
  } catch (error) {
    console.error("Erreur lors de la vérification hiérarchie:", error);
    return { canManage: false };
  }
}

// ============================================
// VÉRIFIER SI L'UTILISATEUR COURANT PEUT GÉRER PLUSIEURS USERS (BATCH)
// ============================================

export async function canManageUsersAction(
  targetUserIds: string[]
): Promise<Record<string, boolean>> {
  try {
    const session = await verifySession();
    // Lecture uniquement : 1 seule permission
    await requirePermission(session.user.id, "members:read");

    const results: Record<string, boolean> = {};

    // Vérifier les permissions pour chaque user
    await Promise.all(
      targetUserIds.map(async (targetUserId) => {
        try {
          results[targetUserId] = await canManageUser(session.user.id, targetUserId);
        } catch {
          results[targetUserId] = false;
        }
      })
    );

    return results;
  } catch (error) {
    console.error("Erreur lors de la vérification hiérarchie batch:", error);
    // Retourner false pour tous les users en cas d'erreur
    return targetUserIds.reduce((acc, id) => ({ ...acc, [id]: false }), {});
  }
}

// ============================================
// LISTE DES UTILISATEURS (avec filtres & pagination)
// ============================================

export async function listUsers(
  filters: ListUsersFilters = {}
): Promise<DataResponse<ListUsersResponse>> {
  try {
    const session = await verifySession();
    await requirePermission(session.user.id, "members:read");

    const {
      search,
      status,
      roleId,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = filters;

    // Construire les conditions WHERE
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(user.name, `%${search}%`),
          like(user.email, `%${search}%`)
        )
      );
    }

    if (status) {
      conditions.push(eq(user.status, status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Compter le total
    const [{ value: total }] = await db
      .select({ value: count() })
      .from(user)
      .where(whereClause);

    // Construire le tri
    const orderByColumn = {
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    }[sortBy];

    const orderByDirection = sortOrder === "asc" ? asc : desc;

    // Récupérer les utilisateurs avec pagination
    const offset = (page - 1) * limit;
    const users = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        status: user.status,
        banned: user.banned,
        banReason: user.banReason,
        banExpiresAt: user.banExpiresAt,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(whereClause)
      .orderBy(orderByDirection(orderByColumn))
      .limit(limit)
      .offset(offset);

    // Récupérer les rôles de chaque utilisateur en utilisant getUserRoles de rbac.ts
    const usersWithRoles: UserWithRoles[] = await Promise.all(
      users.map(async (u) => {
        const userRolesList = await getUserRoles(u.id);

        return {
          ...u,
          status: u.status as UserStatus,
          roles: userRolesList,
        };
      })
    );

    // Filtrer par roleId si fourni
    let filteredUsers = usersWithRoles;
    if (roleId) {
      filteredUsers = usersWithRoles.filter((u) =>
        u.roles.some((r) => r.id === roleId)
      );
    }

    const responseData: ListUsersResponse = {
      users: filteredUsers,
      total: typeof total === "number" ? total : Number(total),
      page,
      limit,
      totalPages: Math.ceil(
        (typeof total === "number" ? total : Number(total)) / limit
      ),
    };

    return { success: true, data: responseData };
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs:", error);
    return {
      success: false,
      error: "Impossible de récupérer les utilisateurs. Veuillez réessayer.",
    };
  }
}

// ============================================
// RÉCUPÉRER UN UTILISATEUR PAR ID
// ============================================

export async function getUserById(
  userId: string
): Promise<DataResponse<UserWithRoles>> {
  try {
    const session = await verifySession();
    await requirePermission(session.user.id,"members:read");

    const userRecord = await db.query.user.findFirst({
      where: eq(user.id, userId),
    });

    if (!userRecord) {
      return {
        success: false,
        error: "Utilisateur introuvable.",
      };
    }

    // Utiliser getUserRoles de rbac.ts
    const userRolesList = await getUserRoles(userId);

    const userData: UserWithRoles = {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      emailVerified: userRecord.emailVerified,
      image: userRecord.image,
      status: userRecord.status as UserStatus,
      banned: userRecord.banned,
      banReason: userRecord.banReason,
      banExpiresAt: userRecord.banExpiresAt,
      createdAt: userRecord.createdAt,
      roles: userRolesList,
    };

    return { success: true, data: userData };
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error);
    return {
      success: false,
      error: "Impossible de récupérer l'utilisateur. Veuillez réessayer.",
    };
  }
}

// ============================================
// CHANGER LES RÔLES D'UN UTILISATEUR
// ============================================

export async function setUserRoles(
  userId: string,
  roleIds: string[]
): Promise<ActionResponse> {
  try {
    const session = await verifySession();
    await requireAllPermissions(session.user.id,["members:read","members:update","members:change_role"]);

    // Vérifier que l'utilisateur cible existe
    const targetUser = await db.query.user.findFirst({
      where: eq(user.id, userId),
    });

    if (!targetUser) {
      return { success: false, error: "Utilisateur introuvable" };
    }

    // Vérifier la hiérarchie (priorité)
    await requireCanManageUser(session.user.id, userId);

    // Récupérer les anciens rôles pour le log (avant transaction)
    const oldRoles = await db
      .select({ name: roles.name })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));

    // Transaction atomique : suppression + insertion en une seule opération
    // Si l'insertion échoue, la suppression est annulée (rollback)
    await db.transaction(async (tx) => {
      // 1. Supprimer tous les rôles existants
      await tx.delete(userRoles).where(eq(userRoles.userId, userId));

      // 2. Ajouter les nouveaux rôles
      if (roleIds.length > 0) {
        await tx.insert(userRoles).values(
          roleIds.map((roleId) => ({
            userId,
            roleId,
            assignedBy: session.user.id,
            assignedAt: new Date(),
          }))
        );
      }
    });

    // Récupérer les nouveaux rôles pour le log (après transaction)
    const newRoles = await db
      .select({ name: roles.name })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));

    // Audit log
    const headersList = await headers();
    const auditContext = getAuditContext(headersList);
    await logAudit({
      userId: session.user.id,
      action: "update",
      resource: "user",
      resourceId: userId,
      metadata: {
        oldRoles: oldRoles.map((r) => r.name),
        newRoles: newRoles.map((r) => r.name),
        targetUserEmail: targetUser.email,
      },
      ...auditContext,
    });

    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la modification des rôles:", error);
    return {
      success: false,
      error: "Impossible de modifier les rôles de l'utilisateur",
    };
  }
}

// ============================================
// BANNIR UN UTILISATEUR
// ============================================

export async function banUser(
  userId: string,
  reason: string
): Promise<ActionResponse> {
  try {
    const session = await verifySession();
    await requireAllPermissions(session.user.id,["members:read","members:update","members:ban"]);

    // Vérifier que l'utilisateur cible existe
    const targetUser = await db.query.user.findFirst({
      where: eq(user.id, userId),
    });

    if (!targetUser) {
      return { success: false, error: "Utilisateur introuvable" };
    }

    // Vérifier la hiérarchie (priorité)
    await requireCanManageUser(session.user.id, userId);

    // Bannir l'utilisateur (permanent uniquement)
    await db
      .update(user)
      .set({
        status: "banned",
        banned: true,
        banReason: reason,
        banExpiresAt: null, // Permanent
      })
      .where(eq(user.id, userId));

    // Audit log
    const headersList = await headers();
    const auditContext = getAuditContext(headersList);
    await logAudit({
      userId: session.user.id,
      action: "ban",
      resource: "user",
      resourceId: userId,
      metadata: {
        reason,
        type: "permanent",
        targetUserEmail: targetUser.email,
        targetUserName: targetUser.name,
      },
      ...auditContext,
    });

    return { success: true };
  } catch (error) {
    console.error("Erreur lors du bannissement:", error);
    return { success: false, error: "Impossible de bannir l'utilisateur" };
  }
}

// ============================================
// DÉBANNIR UN UTILISATEUR
// ============================================

export async function unbanUser(userId: string): Promise<ActionResponse> {
  try {
    const session = await verifySession();
    await requireAllPermissions(session.user.id,["members:read","members:update","members:ban"]);

    // Vérifier que l'utilisateur cible existe
    const targetUser = await db.query.user.findFirst({
      where: eq(user.id, userId),
    });

    if (!targetUser) {
      return { success: false, error: "Utilisateur introuvable" };
    }

    // Vérifier la hiérarchie (priorité)
    await requireCanManageUser(session.user.id, userId);

    // Débannir l'utilisateur (repasser à active)
    await db
      .update(user)
      .set({
        status: "active",
        banned: false,
        banReason: null,
        banExpiresAt: null,
      })
      .where(eq(user.id, userId));

    // Audit log
    const headersList = await headers();
    const auditContext = getAuditContext(headersList);
    await logAudit({
      userId: session.user.id,
      action: "unban",
      resource: "user",
      resourceId: userId,
      metadata: {
        targetUserEmail: targetUser.email,
        targetUserName: targetUser.name,
      },
      ...auditContext,
    });

    return { success: true };
  } catch (error) {
    console.error("Erreur lors du débannissement:", error);
    return { success: false, error: "Impossible de débannir l'utilisateur" };
  }
}

// ============================================
// ACCEPTER UN UTILISATEUR EN ATTENTE
// ============================================

export async function acceptUser(userId: string): Promise<ActionResponse> {
  try {
    const session = await verifySession();
    await requireAllPermissions(session.user.id,["members:read","members:update"]);

    // Vérifier que l'utilisateur existe et est en attente
    const targetUser = await db.query.user.findFirst({
      where: eq(user.id, userId),
    });

    if (!targetUser) {
      return { success: false, error: "Utilisateur introuvable" };
    }

    if (targetUser.status !== "pending") {
      return { success: false, error: "L'utilisateur n'est pas en attente" };
    }

    // Vérifier la hiérarchie (priorité)
    await requireCanManageUser(session.user.id, userId);

    // Transaction atomique : changement de statut + assignation du rôle
    // Si l'assignation du rôle échoue, le statut reste "pending"
    await db.transaction(async (tx) => {
      // 1. Passer le statut à "active"
      await tx.update(user).set({ status: "active" }).where(eq(user.id, userId));

      // 2. S'assurer que l'utilisateur a au moins un rôle (assigne "Membre" si aucun)
      await ensureUserHasRole(tx, userId, session.user.id);
    });

    // Audit log
    const headersList = await headers();
    const auditContext = getAuditContext(headersList);
    await logAudit({
      userId: session.user.id,
      action: "update",
      resource: "user",
      resourceId: userId,
      metadata: {
        action: "accept",
        oldStatus: "pending",
        newStatus: "active",
        targetUserEmail: targetUser.email,
      },
      ...auditContext,
    });

    return { success: true };
  } catch (error) {
    console.error("Erreur lors de l'acceptation de l'utilisateur:", error);
    return { success: false, error: "Impossible d'accepter l'utilisateur" };
  }
}

// ============================================
// REJETER UN UTILISATEUR EN ATTENTE (SUPPRIMER)
// ============================================

export async function rejectUser(userId: string): Promise<ActionResponse> {
  try {
    const session = await verifySession();
    await requireAllPermissions(session.user.id,["members:read","members:update","members:delete"]);

    // Vérifier que l'utilisateur existe et est en attente
    const targetUser = await db.query.user.findFirst({
      where: eq(user.id, userId),
    });

    if (!targetUser) {
      return { success: false, error: "Utilisateur introuvable" };
    }

    if (targetUser.status !== "pending") {
      return { success: false, error: "L'utilisateur n'est pas en attente" };
    }

    // Vérifier la hiérarchie (priorité)
    await requireCanManageUser(session.user.id, userId);

    // Supprimer l'utilisateur (cascade delete des sessions/accounts/roles)
    await db.delete(user).where(eq(user.id, userId));

    // Audit log
    const headersList = await headers();
    const auditContext = getAuditContext(headersList);
    await logAudit({
      userId: session.user.id,
      action: "delete",
      resource: "user",
      resourceId: userId,
      metadata: {
        action: "reject",
        targetUserEmail: targetUser.email,
      },
      ...auditContext,
    });

    return { success: true };
  } catch (error) {
    console.error("Erreur lors du rejet de l'utilisateur:", error);
    return { success: false, error: "Impossible de rejeter l'utilisateur" };
  }
}

// ============================================
// SUPPRIMER UN UTILISATEUR
// ============================================

export async function deleteUser(userId: string): Promise<ActionResponse> {
  try {
    const session = await verifySession();
    await requireAllPermissions(session.user.id,["members:read","members:update","members:delete"]);

    // Ne pas autoriser la suppression de son propre compte
    if (userId === session.user.id) {
      return {
        success: false,
        error: "Vous ne pouvez pas supprimer votre propre compte",
      };
    }

    // Récupérer les infos de l'utilisateur pour le log
    const targetUser = await db.query.user.findFirst({
      where: eq(user.id, userId),
    });

    if (!targetUser) {
      return { success: false, error: "Utilisateur introuvable" };
    }

    // Vérifier la hiérarchie (priorité)
    await requireCanManageUser(session.user.id, userId);

    // Supprimer l'utilisateur (cascade delete)
    await db.delete(user).where(eq(user.id, userId));

    // Audit log
    const headersList = await headers();
    const auditContext = getAuditContext(headersList);
    await logAudit({
      userId: session.user.id,
      action: "delete",
      resource: "user",
      resourceId: userId,
      metadata: {
        targetUserEmail: targetUser.email,
        targetUserName: targetUser.name,
      },
      ...auditContext,
    });

    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la suppression:", error);
    return { success: false, error: "Impossible de supprimer l'utilisateur" };
  }
}

// ============================================
// RESET LE MOT DE PASSE D'UN UTILISATEUR
// ============================================

export async function resetUserPassword(
  userId: string
): Promise<ActionResponse> {
  try {
    const session = await verifySession();
    await requireAllPermissions(session.user.id,["members:read","members:update"]);

    // Récupérer l'utilisateur
    const targetUser = await db.query.user.findFirst({
      where: eq(user.id, userId),
    });

    if (!targetUser) {
      return { success: false, error: "Utilisateur introuvable" };
    }

    // Vérifier la hiérarchie (priorité)
    await requireCanManageUser(session.user.id, userId);

    // Générer un token de reset password avec Better-Auth
    const headersList = await headers();
    await auth.api.forgetPassword({
      headers: headersList,
      body: {
        email: targetUser.email,
        redirectTo: "/auth/reset-password",
      },
    });

    // Audit log
    const auditContext = getAuditContext(headersList);
    await logAudit({
      userId: session.user.id,
      action: "update",
      resource: "user",
      resourceId: userId,
      metadata: {
        action: "reset_password",
        targetUserEmail: targetUser.email,
      },
      ...auditContext,
    });

    return { success: true };
  } catch (error) {
    console.error("Erreur lors du reset du mot de passe:", error);
    return {
      success: false,
      error: "Impossible d'envoyer l'email de réinitialisation",
    };
  }
}

// ============================================
// CRÉER UN NOUVEAU MEMBRE MANUELLEMENT
// ============================================

/**
 * Crée un nouveau membre avec les informations fournies
 *
 * Flow :
 * 1. Valide les données côté serveur avec Zod
 * 2. Vérifie les permissions (members:invite, members:create)
 * 3. Génère un mot de passe temporaire sécurisé
 * 4. Crée l'utilisateur via Better-Auth Admin
 * 5. Assigne le rôle choisi
 * 6. Génère un token de reset password
 * 7. Envoie l'email de bienvenue avec le lien de reset
 * 8. Log l'action dans les audits
 *
 * @param data - Les données du nouveau membre (email, name, roleId, status)
 * @returns ActionResponse avec succès ou message d'erreur
 */
export async function createMember(
  data: CreateMemberInput
): Promise<ActionResponse> {
  try {
    // 1. Vérifier la session
    const session = await verifySession();

    // 2. Vérifier les permissions (écriture : multiple permissions)
    await requireAllPermissions(session.user.id, [
      "members:invite",
      "members:create",
    ]);

    // 3. Validation Zod côté serveur
    const validatedData = CreateMemberSchema.parse(data);

    // 4. Vérifier si l'email existe déjà
    const existingUser = await db.query.user.findFirst({
      where: eq(user.email, validatedData.email),
    });

    if (existingUser) {
      return {
        success: false,
        error: "Un utilisateur avec cet email existe déjà",
      };
    }

    // 5. Vérifier que le rôle existe
    const role = await db.query.roles.findFirst({
      where: eq(roles.id, validatedData.roleId),
    });

    if (!role) {
      return {
        success: false,
        error: "Le rôle sélectionné n'existe pas",
      };
    }

    // 6. Générer un mot de passe temporaire sécurisé
    const tempPassword = generateSecurePassword();

    // 7. Hasher le mot de passe temporaire
    // Better-Auth utilise bcrypt pour hasher les mots de passe
    const bcrypt = require("bcrypt");
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // 8. Créer l'utilisateur et son compte dans une transaction
    const userId = nanoid();

    await db.transaction(async (tx) => {
      // Créer l'utilisateur
      await tx
        .insert(user)
        .values({
          id: userId,
          email: validatedData.email,
          name: validatedData.name,
          emailVerified: true, // Admin crée = email vérifié automatiquement
          status: validatedData.status,
        });

      // Créer l'account avec le mot de passe hashé (pour email/password auth)
      await tx.insert(account).values({
        id: nanoid(),
        accountId: userId, // L'accountId est le même que l'userId pour email/password
        providerId: "credential", // Provider ID pour email/password
        userId: userId,
        password: hashedPassword,
      });

      // Assigner le rôle
      await tx.insert(userRoles).values({
        userId: userId,
        roleId: validatedData.roleId,
        assignedBy: session.user.id,
      });
    });

    // 9. Générer un token de reset password et envoyer l'email de bienvenue
    const headersList = await headers();

    try {
      // Générer le token de reset password avec Better-Auth
      await auth.api.forgetPassword({
        headers: headersList,
        body: {
          email: validatedData.email,
          redirectTo: "/auth/reset-password",
        },
      });

      // Construire l'URL de reset password
      const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";

      // Note: Le lien exact sera généré par Better-Auth et envoyé via sendWelcomeEmail
      // Pour l'instant, on utilise une URL générique
      const resetPasswordUrl = `${baseUrl}/auth/reset-password`;

      // Envoyer l'email de bienvenue
      await sendWelcomeEmail(
        validatedData.email,
        validatedData.name,
        role.name,
        resetPasswordUrl
      );
    } catch (emailError) {
      console.error("Erreur lors de l'envoi de l'email:", emailError);
      // Ne pas bloquer la création si l'email échoue
      // L'admin peut toujours renvoyer un reset password manuellement
    }

    // 10. Log l'action dans les audits
    const auditContext = getAuditContext(headersList);
    await logAudit({
      userId: session.user.id,
      action: "create",
      resource: "user",
      resourceId: userId,
      metadata: {
        targetUserEmail: validatedData.email,
        targetUserName: validatedData.name,
        assignedRoleId: validatedData.roleId,
        assignedRoleName: role.name,
        status: validatedData.status,
      },
      ...auditContext,
    });

    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la création du membre:", error);

    // Gestion des erreurs Zod
    if (error instanceof Error && error.name === "ZodError") {
      return {
        success: false,
        error: "Données invalides. Veuillez vérifier le formulaire.",
      };
    }

    return {
      success: false,
      error: "Impossible de créer le membre. Veuillez réessayer.",
    };
  }
}
