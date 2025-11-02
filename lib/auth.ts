import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db/drizzle";
import { schema } from "@/db/schema";

export const auth = betterAuth({
  // Activation de l'authentification par email/mot de passe
  emailAndPassword: {
    enabled: true,
  },

  // Connexion à la base de données via Drizzle
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),

  // Plugin pour Next.js (gestion des cookies)
  plugins: [nextCookies()],
});