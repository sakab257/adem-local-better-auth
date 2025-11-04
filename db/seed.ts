import { db } from "./drizzle";
import { roles, permissions, rolePermissions } from "./schema";
import { nanoid } from "nanoid";

/**
 * Script de seed pour initialiser les rôles et permissions ADEM
 *
 * Usage: pnpm tsx db/seed.ts
 *
 * Note: Vous pouvez ajouter/modifier les permissions plus tard via l'UI Admin
 */

// ============================================
// DÉFINITION DES RÔLES ADEM
// ============================================

const ROLES_ADEM = [
  {
    id: nanoid(),
    name: "Admin",
    description: "Administrateur avec accès total à toutes les fonctionnalités",
    color: "#ef4444", // red-500
    priority: 100,
  },
  {
    id: nanoid(),
    name: "Moderateur",
    description: "Modération du contenu et des membres",
    color: "#f97316", // orange-500
    priority: 80,
  },
  {
    id: nanoid(),
    name: "Bureau",
    description: "Gestion des événements et invitations de nouveaux membres",
    color: "#8b5cf6", // violet-500
    priority: 70,
  },
  {
    id: nanoid(),
    name: "CA",
    description: "Conseil d'administration - gestion événements et invitations",
    color: "#6366f1", // indigo-500
    priority: 70,
  },
  {
    id: nanoid(),
    name: "SuperCorrecteur",
    description: "Validation des ressources avec bypass du workflow (validation instantanée)",
    color: "#10b981", // emerald-500
    priority: 60,
  },
  {
    id: nanoid(),
    name: "Correcteur",
    description: "Validation des ressources (1 validation parmi 3 requises)",
    color: "#14b8a6", // teal-500
    priority: 50,
  },
  {
    id: nanoid(),
    name: "Membre",
    description: "Utilisateur standard avec accès aux ressources",
    color: "#3b82f6", // blue-500
    priority: 10,
  },
] as const;

// ============================================
// DÉFINITION DES PERMISSIONS DE BASE
// ============================================

const PERMISSIONS_BASE = [
  // === ÉVÉNEMENTS ===
  {
    id: nanoid(),
    name: "events:create",
    description: "Créer de nouveaux événements",
    resource: "events",
    action: "create",
  },
  {
    id: nanoid(),
    name: "events:read",
    description: "Voir les événements",
    resource: "events",
    action: "read",
  },
  {
    id: nanoid(),
    name: "events:update",
    description: "Modifier les événements existants",
    resource: "events",
    action: "update",
  },
  {
    id: nanoid(),
    name: "events:delete",
    description: "Supprimer des événements",
    resource: "events",
    action: "delete",
  },
  {
    id: nanoid(),
    name: "events:manage_inscriptions",
    description: "Gérer les inscriptions aux événements",
    resource: "events",
    action: "manage_inscriptions",
  },

  // === RESSOURCES (Cours, Exercices, Annales) ===
  {
    id: nanoid(),
    name: "resources:create",
    description: "Créer de nouvelles ressources",
    resource: "resources",
    action: "create",
  },
  {
    id: nanoid(),
    name: "resources:read",
    description: "Consulter les ressources",
    resource: "resources",
    action: "read",
  },
  {
    id: nanoid(),
    name: "resources:update",
    description: "Modifier les ressources",
    resource: "resources",
    action: "update",
  },
  {
    id: nanoid(),
    name: "resources:delete",
    description: "Supprimer des ressources",
    resource: "resources",
    action: "delete",
  },
  {
    id: nanoid(),
    name: "resources:validate",
    description: "Valider une ressource (1/3 validations)",
    resource: "resources",
    action: "validate",
  },
  {
    id: nanoid(),
    name: "resources:publish",
    description: "Publier instantanément (bypass workflow 3 validations)",
    resource: "resources",
    action: "publish",
  },

  // === MEMBRES ===
  {
    id: nanoid(),
    name: "members:read",
    description: "Voir la liste des membres",
    resource: "members",
    action: "read",
  },
  {
    id: nanoid(),
    name: "members:invite",
    description: "Inviter de nouveaux membres (whitelist)",
    resource: "members",
    action: "invite",
  },
  {
    id: nanoid(),
    name: "members:create",
    description: "Créer manuellement un compte utilisateur",
    resource: "members",
    action: "create",
  },
  {
    id: nanoid(),
    name: "members:update",
    description: "Modifier les informations d'un membre",
    resource: "members",
    action: "update",
  },
  {
    id: nanoid(),
    name: "members:delete",
    description: "Supprimer un membre",
    resource: "members",
    action: "delete",
  },
  {
    id: nanoid(),
    name: "members:ban",
    description: "Bannir/suspendre un membre",
    resource: "members",
    action: "ban",
  },
  {
    id: nanoid(),
    name: "members:change_role",
    description: "Modifier le rôle d'un membre",
    resource: "members",
    action: "change_role",
  },

  // === RÔLES & PERMISSIONS ===
  {
    id: nanoid(),
    name: "roles:read",
    description: "Voir les rôles et permissions",
    resource: "roles",
    action: "read",
  },
  {
    id: nanoid(),
    name: "roles:create",
    description: "Créer de nouveaux rôles",
    resource: "roles",
    action: "create",
  },
  {
    id: nanoid(),
    name: "roles:update",
    description: "Modifier les rôles et leurs permissions",
    resource: "roles",
    action: "update",
  },
  {
    id: nanoid(),
    name: "roles:delete",
    description: "Supprimer un rôle",
    resource: "roles",
    action: "delete",
  },

  // === AUDIT LOGS ===
  {
    id: nanoid(),
    name: "logs:read",
    description: "Consulter les logs d'audit",
    resource: "logs",
    action: "read",
  },

  // === TÂCHES ===
  {
    id: nanoid(),
    name: "tasks:read",
    description: "Voir les tâches",
    resource: "tasks",
    action: "read",
  },
  {
    id: nanoid(),
    name: "tasks:create",
    description: "Créer des tâches",
    resource: "tasks",
    action: "create",
  },
  {
    id: nanoid(),
    name: "tasks:update",
    description: "Modifier des tâches",
    resource: "tasks",
    action: "update",
  },
  {
    id: nanoid(),
    name: "tasks:delete",
    description: "Supprimer des tâches",
    resource: "tasks",
    action: "delete",
  },

  // === FEEDBACK ===
  {
    id: nanoid(),
    name: "feedback:read",
    description: "Consulter les feedbacks utilisateurs",
    resource: "feedback",
    action: "read",
  },
  {
    id: nanoid(),
    name: "feedback:create",
    description: "Envoyer un feedback",
    resource: "feedback",
    action: "create",
  },
] as const;

// ============================================
// MAPPING RÔLES → PERMISSIONS
// ============================================

const ROLE_PERMISSIONS_MAPPING: Record<string, string[]> = {
  // ADMIN : Tout
  Admin: [
    "events:create", "events:read", "events:update", "events:delete", "events:manage_inscriptions",
    "resources:create", "resources:read", "resources:update", "resources:delete", "resources:validate", "resources:publish",
    "members:read", "members:invite", "members:create", "members:update", "members:delete", "members:ban", "members:change_role",
    "roles:read", "roles:create", "roles:update", "roles:delete",
    "logs:read",
    "tasks:read", "tasks:create", "tasks:update", "tasks:delete",
    "feedback:read", "feedback:create",
  ],

  // MODERATEUR : Modération membres + contenu
  Moderateur: [
    "events:read",
    "resources:read", "resources:validate",
    "members:read", "members:update", "members:ban",
    "logs:read",
    "tasks:read", "tasks:create", "tasks:update", "tasks:delete",
    "feedback:read", "feedback:create",
  ],

  // BUREAU : Gestion événements + invitations
  Bureau: [
    "events:create", "events:read", "events:update", "events:delete", "events:manage_inscriptions",
    "resources:read",
    "members:read", "members:invite", "members:create",
    "tasks:read", "tasks:create", "tasks:update", "tasks:delete",
    "feedback:read", "feedback:create",
  ],

  // CA : Même chose que Bureau
  CA: [
    "events:create", "events:read", "events:update", "events:delete", "events:manage_inscriptions",
    "resources:read",
    "members:read", "members:invite", "members:create",
    "tasks:read", "tasks:create", "tasks:update", "tasks:delete",
    "feedback:read", "feedback:create",
  ],

  // SUPERCORRECTEUR : Validation instantanée des ressources
  SuperCorrecteur: [
    "events:read",
    "resources:read", "resources:create", "resources:update", "resources:validate", "resources:publish",
    "members:read",
    "tasks:read", "tasks:create", "tasks:update", "tasks:delete",
    "feedback:read", "feedback:create",
  ],

  // CORRECTEUR : Validation normale (1/3)
  Correcteur: [
    "events:read",
    "resources:read", "resources:create", "resources:update", "resources:validate",
    "members:read",
    "tasks:read", "tasks:create", "tasks:update", "tasks:delete",
    "feedback:read", "feedback:create",
  ],

  // MEMBRE : Accès basique
  Membre: [
    "events:read",
    "resources:read",
    "members:read",
    "tasks:read", "tasks:create", "tasks:update", "tasks:delete",
    "feedback:create",
  ],
};

// ============================================
// FONCTION DE SEED
// ============================================

async function seed() {
  console.log("🌱 Démarrage du seed ADEM...\n");

  try {
    // 1. Insérer les rôles
    console.log("📝 Insertion des 7 rôles ADEM...");
    await db.insert(roles).values(ROLES_ADEM);
    console.log("✅ Rôles insérés avec succès\n");

    // 2. Insérer les permissions
    console.log(`📝 Insertion de ${PERMISSIONS_BASE.length} permissions de base...`);
    await db.insert(permissions).values(PERMISSIONS_BASE);
    console.log("✅ Permissions insérées avec succès\n");

    // 3. Créer les associations rôles ↔ permissions
    console.log("🔗 Association des permissions aux rôles...");

    for (const role of ROLES_ADEM) {
      const permissionsForRole = ROLE_PERMISSIONS_MAPPING[role.name];

      if (!permissionsForRole) {
        console.log(`⚠️  Aucune permission définie pour le rôle "${role.name}"`);
        continue;
      }

      const rolePermissionsData = permissionsForRole.map((permName) => {
        const permission = PERMISSIONS_BASE.find((p) => p.name === permName);
        if (!permission) {
          console.warn(`⚠️  Permission "${permName}" introuvable pour le rôle "${role.name}"`);
          return null;
        }
        return {
          roleId: role.id,
          permissionId: permission.id,
        };
      }).filter(Boolean); // Remove null values

      await db.insert(rolePermissions).values(rolePermissionsData as any);
      console.log(`✅ ${role.name}: ${rolePermissionsData.length} permissions assignées`);
    }

    console.log("\n🎉 Seed terminé avec succès !");
    console.log("\n📊 Récapitulatif:");
    console.log(`   - ${ROLES_ADEM.length} rôles créés`);
    console.log(`   - ${PERMISSIONS_BASE.length} permissions créées`);
    console.log(`   - ${Object.values(ROLE_PERMISSIONS_MAPPING).flat().length} associations rôle-permission`);

    console.log("\n💡 Prochaines étapes:");
    console.log("   1. Créer votre premier admin: pnpm admin:promote <email>");
    console.log("   2. Modifier les permissions via l'UI Admin (/admin/roles)");
    console.log("   3. Ajouter de nouvelles permissions au fur et à mesure\n");

  } catch (error) {
    console.error("❌ Erreur lors du seed:", error);
    process.exit(1);
  }
}

// Exécuter le seed
seed()
  .then(() => {
    console.log("✅ Seed exécuté avec succès");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erreur:", error);
    process.exit(1);
  });
