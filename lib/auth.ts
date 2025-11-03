import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db/drizzle";
import { schema } from "@/db/schema";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/email";

export const auth = betterAuth({
  // Activation de l'authentification par email/mot de passe
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,

    // ✅ Envoi d'email pour reset password
    sendResetPassword: async ({ user, url, token }, request) => {
      await sendPasswordResetEmail(user.email, user.name, url);
    },

    // Callback après reset password (optionnel)
    onPasswordReset: async ({ user }, request) => {
      console.log(`✅ Password reset successful for: ${user.email}`);
    },
  },

  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }, request) => {
      // ✅ Envoi d'email de vérification (mock par défaut, Resend si configuré)
      await sendVerificationEmail(user.email, user.name, url);
    },
    sendOnSignUp: true,
  },

  // Connexion à la base de données via Drizzle
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),

  // Plugin pour Next.js (gestion des cookies)
  plugins: [nextCookies()],
});