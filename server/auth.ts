"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { whitelist, user, userRoles, roles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logAudit, getAuditContext } from "@/lib/audit";
import { headers } from "next/headers";
import { ActionResponse } from "@/lib/types";

interface SignUpData {
  name: string;
  email: string;
  password: string;
}

/**
 * Sign-up personnalisé avec logique whitelist
 * - Si email dans whitelist → status "active" + rôle "Membre"
 * - Sinon → status "pending" (en attente de validation admin)
 */
export async function signUpWithWhitelist(
  data: SignUpData
): Promise<ActionResponse> {
  try {
    const { name, email, password } = data;

    // Vérifier si l'email existe dans la whitelist
    const whitelistEntry = await db.query.whitelist.findFirst({
      where: eq(whitelist.email, email.toLowerCase()),
    });

    const isWhitelisted = !!whitelistEntry;

    // Créer l'utilisateur avec Better-Auth via l'API
    const headersList = await headers();
    const response = await auth.api.signUpEmail({
      headers: headersList,
      body: {
        name,
        email,
        password,
      },
    });

    if (!response) {
      return { success: false, error: "Erreur lors de la création du compte" };
    }

    // Récupérer l'utilisateur créé
    const newUser = await db.query.user.findFirst({
      where: eq(user.email, email),
    });

    if (!newUser) {
      return { success: false, error: "Utilisateur introuvable après création" };
    }

    // Définir le statut selon la whitelist
    const userStatus = isWhitelisted ? "active" : "pending";

    // Mettre à jour le statut de l'utilisateur
    await db
      .update(user)
      .set({ status: userStatus })
      .where(eq(user.id, newUser.id));

    // Si whitelisté, assigner automatiquement le rôle "Membre"
    if (isWhitelisted) {
      const membreRole = await db.query.roles.findFirst({
        where: eq(roles.name, "Membre"),
      });

      if (membreRole) {
        await db.insert(userRoles).values({
          userId: newUser.id,
          roleId: membreRole.id,
          assignedAt: new Date(),
          assignedBy: null, // Auto-assigné par le système
        });
      }
    }

    // Audit log
    const auditContext = getAuditContext(headersList);
    await logAudit({
      userId: newUser.id,
      action: "create",
      resource: "user",
      resourceId: newUser.id,
      metadata: {
        email: newUser.email,
        whitelisted: isWhitelisted,
        status: userStatus,
      },
      ...auditContext,
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Erreur lors du sign-up:", error);

    // Gérer les erreurs spécifiques de Better-Auth
    if (error instanceof Error) {
      if (error.message.includes("already exists")) {
        return { success: false, error: "Cet email est déjà utilisé" };
      }
    }

    return { success: false, error: "Erreur lors de la création du compte" };
  }
}
