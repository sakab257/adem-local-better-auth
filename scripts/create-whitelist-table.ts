import { db } from "../db/drizzle";
import { sql } from "drizzle-orm";

async function createWhitelistTable() {
  try {
    console.log("Création de la table whitelist...");

    // Créer la table si elle n'existe pas
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "whitelist" (
        "id" text PRIMARY KEY NOT NULL,
        "email" text NOT NULL,
        "added_by" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "whitelist_email_unique" UNIQUE("email")
      );
    `);

    // Vérifier si la contrainte FK existe déjà
    const constraintExists = await db.execute(sql`
      SELECT 1 FROM pg_constraint
      WHERE conname = 'whitelist_added_by_user_id_fk'
    `);

    if (constraintExists.rows.length === 0) {
      await db.execute(sql`
        ALTER TABLE "whitelist"
        ADD CONSTRAINT "whitelist_added_by_user_id_fk"
        FOREIGN KEY ("added_by") REFERENCES "public"."user"("id")
        ON DELETE set null ON UPDATE no action;
      `);
    }

    // Créer l'index si il n'existe pas
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "whitelist_email_idx"
      ON "whitelist" USING btree ("email");
    `);

    console.log("✅ Table whitelist créée avec succès !");
  } catch (error) {
    console.error("❌ Erreur lors de la création de la table:", error);
    process.exit(1);
  }

  process.exit(0);
}

createWhitelistTable();
