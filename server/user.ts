"use server";

import { auth } from "@/lib/auth";

/**
 * Connexion d'un utilisateur existant
 */
export const signIn = async (email: string, password: string) => {
    try {
        await auth.api.signInEmail({
        body: {
            email,
            password,
        },
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: "Identifiants invalides" };
    }
};

/**
 * Inscription d'un nouvel utilisateur
 */
export const signUp = async (email: string, password: string, name: string) => {
    try {
        await auth.api.signUpEmail({
        body: {
            email,
            password,
            name,
        },
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: "Erreur lors de l'inscription" };
    }
};