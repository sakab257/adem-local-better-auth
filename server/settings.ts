"use server";

import { verifySession } from "@/lib/dal";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db/drizzle";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { updateProfileSchema } from "@/lib/validations/settings";
import { z } from "zod";

/**
 * Mettre à jour le profil utilisateur (nom et email)
 */
export const updateProfile = async (data: { name: string; email: string }) => {
  try {
    // Utilisation du DAL pour vérifier la session
    const session = await verifySession();

    // Validation des données
    const validatedData = updateProfileSchema.parse(data);

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (validatedData.email !== session.user.email) {
      const existingUser = await db.query.user.findFirst({
        where: eq(user.email, validatedData.email),
      });

      if (existingUser && existingUser.id !== session.user.id) {
        return {
          success: false,
          error: "Cet email est déjà utilisé",
        };
      }
    }

    // Mettre à jour le profil
    await db
      .update(user)
      .set({
        name: validatedData.name,
        email: validatedData.email,
        // Si l'email change, on devrait mettre emailVerified à false
        // et envoyer un email de vérification
        ...(validatedData.email !== session.user.email && {
          emailVerified: false,
        }),
      })
      .where(eq(user.id, session.user.id));

    return { success: true };
  } catch (error) {
    // Erreur d'authentification
    if (error instanceof Error && error.message === "Pas autorisé") {
      return { success: false, error: "Non authentifié" };
    }

    // Erreur de validation Zod
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message,
      };
    }

    return {
      success: false,
      error: "Erreur lors de la mise à jour du profil",
    };
  }
};

/**
 * Supprimer le compte utilisateur (soft delete)
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
