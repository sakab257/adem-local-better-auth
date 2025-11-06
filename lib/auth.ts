import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db/drizzle";
import { schema, userRoles, roles } from "@/db/schema";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/email";
import { admin } from "better-auth/plugins";
import { eq } from "drizzle-orm";

export const auth = betterAuth({
  // Activation de l'authentification par email/mot de passe
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,

    // Envoi d'email pour reset password
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail(user.email, user.name, url);
    },

    // Callback après reset password (optionnel)
    onPasswordReset: async ({ user }) => {
      console.log(`Mot de passe réinitialisé pour : ${user.email}`);
    },
  },

  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      // Envoi d'email de vérification (mock par défaut, Resend si configuré)
      await sendVerificationEmail(user.email, user.name, url);
    },
    sendOnSignUp: true,
  },

  // Configuration de la gestion des utilisateurs
  user: {
    changeEmail: {
      enabled: true,
      // Envoie un email de vérification à l'ANCIEN email (sécurité)
      // Après vérification, BetterAuth change l'email et envoie confirmation au nouveau
      sendChangeEmailVerification: async ({ user, newEmail, url }) => {
        await sendVerificationEmail(user.email, user.name, url);
      },
    },
  },

  rateLimit: {
    enabled: true,
    window: 60,
    max: 5,
  },

  // Connexion à la base de données via Drizzle
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),

  // Plugin pour Next.js (gestion des cookies)
  plugins: [
    admin({
      // Configurer qui peut utiliser les fonctions admin
      impersonationSessionDuration: 60 * 60 * 24, // 24 heures
      async impersonatedBy(context: { user: { id: string } }) {
        // Vérifier si l'utilisateur a un des rôles admin
        const userId = context.user.id;

        // Récupérer les rôles de l'utilisateur
        const userRolesList = await db
          .select({
            roleName: roles.name,
          })
          .from(userRoles)
          .innerJoin(roles, eq(userRoles.roleId, roles.id))
          .where(eq(userRoles.userId, userId));

        // Autoriser si Admin ou Moderateur
        const allowedRoles = ["Admin", "Moderateur","Bureau","CA"];
        const hasAllowedRole = userRolesList.some((r) =>
          allowedRoles.includes(r.roleName)
        );

        return hasAllowedRole;
      },
    }),
    nextCookies(),
  ],
});