import { user as userTable } from "@/db/schema";
import { InferSelectModel } from "drizzle-orm";

// Type complet de l'utilisateur depuis la DB
type UserFromDB = InferSelectModel<typeof userTable>;

// Type public exposé au client (sécurisé)
export type PublicUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  emailVerified: boolean;
  createdAt: Date;
};

/**
 * Filtre les données utilisateur pour ne retourner que les champs publics
 * ⚠️ Ne JAMAIS exposer: password, tokens, updatedAt, etc.
 */
export function sanitizeUser(user: UserFromDB): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
  };
}