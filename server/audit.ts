"use server";

import { verifySession } from "@/lib/dal";
import { requirePermission } from "@/lib/rbac";
import { db } from "@/db/drizzle";
import { auditLogs, user, roles } from "@/db/schema";
import { eq, and, gte, lte, desc, count, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { DataResponse, ListAuditLogsFilters, AuditLogEntry, ListAuditLogsResponse } from "@/lib/types";

// ============================================
// RÉCUPÉRER LES LOGS D'AUDIT AVEC FILTRES
// ============================================

/**
 * Récupère la liste des logs d'audit avec filtrage et pagination
 *
 * Permission requise : logs:read
 *
 * @param filters - Filtres optionnels (action, resource, userId, dateRange)
 * @returns DataResponse contenant les logs paginés
 */
export async function listAuditLogs(
  filters: ListAuditLogsFilters = {}
): Promise<DataResponse<ListAuditLogsResponse>> {
  try {
    const session = await verifySession();

    // Vérifier la permission logs:read
    await requirePermission(session.user.id, "logs:read");

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;

    // Construction des conditions de filtrage
    const conditions = [];

    if (filters.action) {
      conditions.push(eq(auditLogs.action, filters.action));
    }

    if (filters.resource) {
      conditions.push(eq(auditLogs.resource, filters.resource));
    }

    if (filters.userId) {
      conditions.push(eq(auditLogs.userId, filters.userId));
    }

    if (filters.dateFrom) {
      conditions.push(gte(auditLogs.createdAt, filters.dateFrom));
    }

    if (filters.dateTo) {
      conditions.push(lte(auditLogs.createdAt, filters.dateTo));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // ==========================================
    // JOINTURES POUR RÉCUPÉRER LES NOMS DES RESSOURCES
    // ==========================================
    // Créer des alias pour éviter les conflits de nommage
    const actionUser = alias(user, "action_user"); // L'utilisateur qui a fait l'action
    const targetUser = alias(user, "target_user"); // L'utilisateur affecté par l'action (resourceId)

    // 📝 POUR AJOUTER UNE NOUVELLE RESSOURCE (ex: cours, événements, tâches) :
    // 1. Importer la table en haut du fichier : import { auditLogs, user, roles, courses } from "@/db/schema";
    // 2. Ajouter un leftJoin ci-dessous avec la condition correspondante
    // 3. Ajouter un WHEN dans le CASE pour récupérer le nom de la ressource
    //
    // Exemple pour "courses" :
    //   .leftJoin(courses, sql`${auditLogs.resourceId} = ${courses.id} AND ${auditLogs.resource} = 'course'`)
    //   WHEN ${auditLogs.resource} = 'course' THEN ${courses.title}

    // Récupérer les logs avec jointures sur user (action + target) et roles (target)
    const logs = await db
      .select({
        id: auditLogs.id,
        userId: auditLogs.userId,
        userName: actionUser.name,
        userEmail: actionUser.email,
        action: auditLogs.action,
        resource: auditLogs.resource,
        resourceId: auditLogs.resourceId,
        // Récupérer le nom de la ressource affectée selon le type
        // ⚠️ IMPORTANT : Ajouter un WHEN pour chaque nouveau type de ressource

        resourceName: sql<string>`CASE
          WHEN ${auditLogs.resource} IN ('user', 'member') THEN ${targetUser.name}
          WHEN ${auditLogs.resource} = 'role' THEN ${roles.name}
          ELSE NULL
        END`,

        /*
          -- 📝 Ajouter ici les nouveaux types de ressources :
          -- WHEN ${auditLogs.resource} = 'event' THEN ${events.title}
          -- WHEN ${auditLogs.resource} = 'resource' THEN ${resources.title}
          -- WHEN ${auditLogs.resource} = 'task' THEN ${tasks.title}
        */
        metadata: auditLogs.metadata,
        ipAddress: auditLogs.ipAddress,
        userAgent: auditLogs.userAgent,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .leftJoin(actionUser, eq(auditLogs.userId, actionUser.id))
      .leftJoin(targetUser, sql`${auditLogs.resourceId} = ${targetUser.id} AND ${auditLogs.resource} IN ('user', 'member')`)
      .leftJoin(roles, sql`${auditLogs.resourceId} = ${roles.id} AND ${auditLogs.resource} = 'role'`)
      // 📝 Ajouter ici les leftJoin pour les nouvelles ressources :
      // .leftJoin(events, sql`${auditLogs.resourceId} = ${events.id} AND ${auditLogs.resource} = 'event'`)
      // .leftJoin(resources, sql`${auditLogs.resourceId} = ${resources.id} AND ${auditLogs.resource} = 'resource'`)
      // .leftJoin(tasks, sql`${auditLogs.resourceId} = ${tasks.id} AND ${auditLogs.resource} = 'task'`)
      .where(whereClause)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);

    // Compter le total
    const [{ total }] = await db
      .select({ total: count() })
      .from(auditLogs)
      .where(whereClause);

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        logs: logs as AuditLogEntry[],
        total,
        page,
        limit,
        totalPages,
      },
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des logs d'audit:", error);
    return {
      success: false,
      error: "Impossible de récupérer les logs d'audit. Veuillez réessayer.",
    };
  }
}

// ============================================
// RÉCUPÉRER TOUTES LES ACTIONS DISPONIBLES
// ============================================

/**
 * Récupère la liste des actions distinctes dans les logs
 * Utilisé pour les filtres
 */
export async function getAvailableActions(): Promise<DataResponse<string[]>> {
  try {
    const session = await verifySession();
    await requirePermission(session.user.id, "logs:read");

    const actions = await db
      .selectDistinct({ action: auditLogs.action })
      .from(auditLogs)
      .orderBy(auditLogs.action);

    return {
      success: true,
      data: actions.map((a) => a.action),
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des actions:", error);
    return {
      success: false,
      error: "Impossible de récupérer les actions.",
    };
  }
}

// ============================================
// RÉCUPÉRER TOUTES LES RESSOURCES DISPONIBLES
// ============================================

/**
 * Récupère la liste des ressources distinctes dans les logs
 * Utilisé pour les filtres
 */
export async function getAvailableResources(): Promise<DataResponse<string[]>> {
  try {
    const session = await verifySession();
    await requirePermission(session.user.id, "logs:read");

    const resources = await db
      .selectDistinct({ resource: auditLogs.resource })
      .from(auditLogs)
      .orderBy(auditLogs.resource);

    return {
      success: true,
      data: resources.map((r) => r.resource),
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des ressources:", error);
    return {
      success: false,
      error: "Impossible de récupérer les ressources.",
    };
  }
}
