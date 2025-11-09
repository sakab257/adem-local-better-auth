import { z } from "zod";

/**
 * Schema de validation pour la création manuelle d'un membre
 *
 * Utilisé pour valider les données du formulaire côté client ET serveur
 */
export const CreateMemberSchema = z.object({
  email: z
    .email("Email invalide")
    .toLowerCase()
    .trim(),

  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères")
    .trim(),

  roleId: z
    .string()
    .min(1, "Veuillez sélectionner un rôle"),

  status: z
    .enum(["active", "pending"])
    .default("active"),
});

/**
 * Type inféré depuis le schema Zod
 * Utilisé pour typer les données du formulaire
 */
export type CreateMemberFormData = z.input<typeof CreateMemberSchema>;
