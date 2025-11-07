"use server";

import { verifySession } from "@/lib/dal";
import { can, requireAllPermissions } from "@/lib/rbac";
import { db } from "@/db/drizzle";
import { whitelist } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logAudit, getAuditContext } from "@/lib/audit";
import { headers } from "next/headers";
import { ActionResponse, WhitelistEntry, DataResponse } from "@/lib/types";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

// ============================================
// FICHIER REFACTORISE AVEC requirePermission / requireAllPermissions
// ============================================

// ============================================
// LISTE DES EMAILS WHITELIST
// ============================================

export async function listWhitelistEmails(): Promise<DataResponse<WhitelistEntry[]>> {
  try {
    const session = await verifySession();
    await requireAllPermissions(session.user.id, ["members:invite","members:read"]);

    const emails = await db
      .select()
      .from(whitelist)
      .orderBy(whitelist.createdAt);

    return { success: true, data: emails };
  } catch (error) {
    console.error("Erreur lors de la récupération de la whitelist:", error);
    return {
      success: false,
      error: "Impossible de récupérer la whitelist. Veuillez réessayer.",
    };
  }
}

// ============================================
// AJOUTER UN EMAIL À LA WHITELIST
// ============================================

export async function addEmailToWhitelist(
  email: string
): Promise<ActionResponse> {
  try {
    const session = await verifySession();
    await requireAllPermissions(session.user.id, ["members:invite","members:read","members:create"]);

    // Normaliser l'email
    const normalizedEmail = email.trim().toLowerCase();

    // Vérifier si l'email existe déjà
    const existing = await db.query.whitelist.findFirst({
      where: eq(whitelist.email, normalizedEmail),
    });

    if (existing) {
      return { success: false, error: "Cet email est déjà dans la whitelist" };
    }

    // Ajouter l'email
    await db.insert(whitelist).values({
      id: nanoid(),
      email: normalizedEmail,
      addedBy: session.user.id,
      createdAt: new Date(),
    });

    // Audit log
    const headersList = await headers();
    const auditContext = getAuditContext(headersList);
    await logAudit({
      userId: session.user.id,
      action: "create",
      resource: "user",
      resourceId: normalizedEmail,
      metadata: { email: normalizedEmail },
      ...auditContext,
    });

    revalidatePath("/invitations");
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de l'ajout à la whitelist:", error);
    return {
      success: false,
      error: "Impossible d'ajouter l'email à la whitelist",
    };
  }
}

// ============================================
// AJOUTER PLUSIEURS EMAILS À LA WHITELIST (BATCH)
// ============================================

export async function addEmailsToWhitelist(
  emails: string[]
): Promise<ActionResponse & { addedCount?: number; skippedCount?: number }> {
  try {
    const session = await verifySession();
    await requireAllPermissions(session.user.id, ["members:invite","members:read","members:create"])

    // Normaliser tous les emails
    const normalizedEmails = emails.map((e) => e.trim().toLowerCase());

    // Récupérer les emails déjà existants
    const existingEmails = await db
      .select({ email: whitelist.email })
      .from(whitelist);
    const existingSet = new Set(existingEmails.map((e) => e.email));

    // Filtrer les nouveaux emails uniquement
    const newEmails = normalizedEmails.filter((e) => !existingSet.has(e));

    if (newEmails.length === 0) {
      return {
        success: false,
        error: "Tous les emails sont déjà dans la whitelist",
        addedCount: 0,
        skippedCount: normalizedEmails.length,
      };
    }

    // Insérer en batch
    await db.insert(whitelist).values(
      newEmails.map((email) => ({
        id: nanoid(),
        email,
        addedBy: session.user.id,
        createdAt: new Date(),
      }))
    );

    // Audit log
    const headersList = await headers();
    const auditContext = getAuditContext(headersList);
    await logAudit({
      userId: session.user.id,
      action: "create",
      resource: "user",
      resourceId: "batch",
      metadata: {
        addedCount: newEmails.length,
        skippedCount: normalizedEmails.length - newEmails.length,
      },
      ...auditContext,
    });

    revalidatePath("/invitations");
    return {
      success: true,
      addedCount: newEmails.length,
      skippedCount: normalizedEmails.length - newEmails.length,
    };
  } catch (error) {
    console.error("Erreur lors de l'ajout batch à la whitelist:", error);
    return {
      success: false,
      error: "Impossible d'ajouter les emails à la whitelist",
    };
  }
}

// ============================================
// SUPPRIMER UN EMAIL DE LA WHITELIST
// ============================================

export async function removeEmailFromWhitelist(
  emailId: string
): Promise<ActionResponse> {
  try {
    const session = await verifySession();
    await requireAllPermissions(session.user.id, ["members:invite","members:read","members:delete"])

    // Récupérer l'email pour le log
    const entry = await db.query.whitelist.findFirst({
      where: eq(whitelist.id, emailId),
    });

    if (!entry) {
      return { success: false, error: "Email introuvable" };
    }

    // Supprimer
    await db.delete(whitelist).where(eq(whitelist.id, emailId));

    // Audit log
    const headersList = await headers();
    const auditContext = getAuditContext(headersList);
    await logAudit({
      userId: session.user.id,
      action: "delete",
      resource: "user",
      resourceId: emailId,
      metadata: { email: entry.email },
      ...auditContext,
    });

    revalidatePath("/invitations");
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la suppression de la whitelist:", error);
    return {
      success: false,
      error: "Impossible de supprimer l'email de la whitelist",
    };
  }
}

// ============================================
// VIDER TOUTE LA WHITELIST
// ============================================

export async function clearWhitelist(): Promise<ActionResponse> {
  try {
    const session = await verifySession();
    await requireAllPermissions(session.user.id, ["members:invite","members:read","members:delete"])

    // Compter les emails avant suppression
    const allEmails = await db.select().from(whitelist);
    const count = allEmails.length;

    // Supprimer tous les emails
    await db.delete(whitelist);

    // Audit log
    const headersList = await headers();
    const auditContext = getAuditContext(headersList);
    await logAudit({
      userId: session.user.id,
      action: "delete",
      resource: "user",
      resourceId: "all",
      metadata: { count },
      ...auditContext,
    });

    revalidatePath("/invitations");
    return { success: true };
  } catch (error) {
    console.error("Erreur lors du vidage de la whitelist:", error);
    return {
      success: false,
      error: "Impossible de vider la whitelist",
    };
  }
}
