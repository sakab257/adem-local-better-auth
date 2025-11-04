"use server";

import { verifySession } from "@/lib/dal";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db/drizzle";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Supprimer le compte utilisateur
 * Note: Le changement de profil (nom, email) est géré nativement par BetterAuth
 * via authClient.updateUser() et authClient.changeEmail()
 */
export const deleteAccount = async () => {
  try {
    // ✅ Utilisation du DAL pour vérifier la session
    const session = await verifySession();

    // Soft delete : on pourrait ajouter un champ deletedAt dans le schéma
    // Pour l'instant, on va vraiment supprimer l'utilisateur et ses données

    // Supprimer toutes les sessions de l'utilisateur
    // (BetterAuth le fait automatiquement avec onDelete: cascade)

    // Supprimer l'utilisateur
    await db.delete(user).where(eq(user.id, session.user.id));

    // Déconnexion (la session sera invalide)
    await auth.api.signOut({
      headers: await headers(),
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
