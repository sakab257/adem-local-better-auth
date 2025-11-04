import { pgTable, text, timestamp, boolean, index, integer, primaryKey } from "drizzle-orm/pg-core";

// ============================================
// TABLES BETTER-AUTH (Core)
// ============================================

export const user = pgTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    status: text("status", { enum: ["active", "pending", "suspended", "banned"] }).default("pending").notNull(),
    // Better-Auth Admin Plugin fields
    banned: boolean("banned").default(false),
    banReason: text("ban_reason"),
    banExpiresAt: timestamp("ban_expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
}, (table) => ({
    emailIdx: index("user_email_idx").on(table.email),
    statusIdx: index("user_status_idx").on(table.status),
}));

export const session = pgTable("session", {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .$onUpdate(() => new Date())
        .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
}, (table) => ({
    userIdx: index("session_user_idx").on(table.userId),
    tokenIdx: index("session_token_idx").on(table.token),
}));

export const account = pgTable("account", {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .$onUpdate(() => new Date())
        .notNull(),
}, (table) => ({
    userIdx: index("account_user_idx").on(table.userId),
}));

export const verification = pgTable("verification", {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
}, (table) => ({
    identifierIdx: index("verification_identifier_idx").on(table.identifier),
}));

// ============================================
// RBAC - Rôles & Permissions
// ============================================
export const roles = pgTable("role", {
    id: text("id").primaryKey(),
    name: text("name").notNull().unique(),
    description: text("description"),
    color: text("color").default("#6366f1"),
    priority: integer("priority").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
}, (table) => ({
    nameIdx: index("role_name_idx").on(table.name),
    priorityIdx: index("role_priority_idx").on(table.priority),
}));

export const permissions = pgTable("permission", {
    id: text("id").primaryKey(),
    name: text("name").notNull().unique(),
    description: text("description"),
    resource: text("resource").notNull(),
    action: text("action").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
    nameIdx: index("permission_name_idx").on(table.name),
    resourceIdx: index("permission_resource_idx").on(table.resource),
}));

// Table de liaison rôles <-> permissions (many-to-many)
export const rolePermissions = pgTable("role_permission", {
    roleId: text("role_id").references(() => roles.id, { onDelete: "cascade" }).notNull(),
    permissionId: text("permission_id").references(() => permissions.id, { onDelete: "cascade" }).notNull(),
    }, (table) => ({
    pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
    roleIdx: index("role_permission_role_idx").on(table.roleId),
    permissionIdx: index("role_permission_perm_idx").on(table.permissionId),
}));

export const userRoles = pgTable("user_role", {
    userId: text("user_id")
        .references(() => user.id, { onDelete: "cascade" })
        .notNull(),
    roleId: text("role_id")
        .references(() => roles.id, { onDelete: "cascade" })
        .notNull(),
    assignedAt: timestamp("assigned_at").defaultNow().notNull(),
    assignedBy: text("assigned_by")
        .references(() => user.id, { onDelete: "set null" }),
}, (table) => ({
    pk: primaryKey({ columns: [table.userId, table.roleId] }),
    userIdx: index("user_role_user_idx").on(table.userId),
    roleIdx: index("user_role_role_idx").on(table.roleId),
}));

// ============================================
// AUDIT & TRAÇABILITÉ
// ============================================

export const auditLogs = pgTable("audit_log", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .references(() => user.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    resource: text("resource").notNull(),
    resourceId: text("resource_id"),
    metadata: text("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
    userIdx: index("audit_log_user_idx").on(table.userId),
    actionIdx: index("audit_log_action_idx").on(table.action),
    resourceIdx: index("audit_log_resource_idx").on(table.resource),
    createdAtIdx: index("audit_log_created_at_idx").on(table.createdAt),
}));

// ============================================
// ORGANISATION - Hiérarchie Cours
// ============================================

export const orgUnits = pgTable("org_unit", {
    id: text("id").primaryKey(),
    type: text("type", {
        enum: ["annee", "filiere", "matiere"]
    }).notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    parentId: text("parent_id")
        .references((): any => orgUnits.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
}, (table) => ({
    typeIdx: index("org_unit_type_idx").on(table.type),
    slugIdx: index("org_unit_slug_idx").on(table.slug),
    parentIdx: index("org_unit_parent_idx").on(table.parentId),
}));

// ============================================
// EXPORT SCHEMA
// ============================================

export const schema = {
    // Better-Auth core
    user,
    session,
    account,
    verification,
    // RBAC
    roles,
    permissions,
    rolePermissions,
    userRoles,
    // Audit
    auditLogs,
    // Organisation
    orgUnits,
};
