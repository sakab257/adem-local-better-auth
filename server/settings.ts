"use server";

import { verifySession } from "@/lib/dal";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db/drizzle";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logAudit, getAuditContext } from "@/lib/audit";

/**
 * Supprimer le compte utilisateur
 * Note: Le changement de profil (nom, email) est géré nativement par BetterAuth
 * via authClient.updateUser() et authClient.changeEmail()
 */
export const deleteAccount = async () => {
  try {
    // ✅ Utilisation du DAL pour vérifier la session
    const session = await verifySession();

    // Récupérer les infos de l'utilisateur pour le log avant suppression
    const userRecord = await db.query.user.findFirst({
      where: eq(user.id, session.user.id),
    });

    // Soft delete : on pourrait ajouter un champ deletedAt dans le schéma
    // Pour l'instant, on va vraiment supprimer l'utilisateur et ses données

    // Supprimer toutes les sessions de l'utilisateur
    // (BetterAuth le fait automatiquement avec onDelete: cascade)

    // Supprimer l'utilisateur
    await db.delete(user).where(eq(user.id, session.user.id));

    // Audit log
    const headersList = await headers();
    const auditContext = getAuditContext(headersList);
    await logAudit({
      userId: session.user.id,
      action: "delete",
      resource: "user",
      resourceId: session.user.id,
      metadata: {
        action: "self_delete",
        email: userRecord?.email,
        name: userRecord?.name,
      },
      ...auditContext,
    });

    // Déconnexion (la session sera invalide)
    await auth.api.signOut({
      headers: headersList,
    });

    return { success: true };
  } catch (error) {
    // Erreur d'authentification
    if (error instanceof Error && error.message === "Pas autorisé") {
      return { success: false, error: "Non authentifié" };
    }

    return {
      success: false,
      error: "Erreur lors de la suppression du compte",
    };
  }
};
