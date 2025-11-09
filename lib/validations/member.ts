import { z } from "zod";

/**
 * Schema de validation pour la création manuelle d'un membre
 *
 * Utilisé pour valider les données du formulaire côté client ET serveur
 */
export const CreateMemberSchema = z.object({
  email: z
    .string({ required_error: "L'email est requis" })
    .min(1, "L'email est requis")
    .email("Email invalide")
    .toLowerCase()
    .trim(),

  name: z
    .string({ required_error: "Le nom est requis" })
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères")
    .trim(),

  roleId: z
    .string({ required_error: "Le rôle est requis" })
    .min(1, "Veuillez sélectionner un rôle"),

  status: z
    .enum(["active", "pending"], {
      required_error: "Le statut est requis",
      invalid_type_error: "Statut invalide",
    })
    .default("active"),
});

/**
 * Type inféré depuis le schema Zod
 * Utilisé pour typer les données du formulaire
 */
export type CreateMemberFormData = z.infer<typeof CreateMemberSchema>;
