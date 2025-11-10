/**
 * Types partagés pour l'application ADEM
 */

import { AuditAction, AuditResource } from "./audit";

// ============================================
// TYPES UTILISATEUR
// ============================================

export type UserStatus = "active" | "pending" | "suspended" | "banned";

export interface UserWithRoles {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  status: UserStatus;
  banned: boolean | null;
  banReason: string | null;
  banExpiresAt: Date | null;
  createdAt: Date;
  roles: Array<{
    id: string;
    name: string;
    color: string | null;
    priority: number;
  }>;
}

// ============================================
// TYPES LISTE & FILTRES
// ============================================

export interface ListUsersFilters {
  search?: string;
  status?: UserStatus;
  roleId?: string;
  page?: number;
  limit?: number;
  sortBy?: "name" | "email" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface ListUsersResponse {
  users: UserWithRoles[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// TYPES RÉPONSES SERVER ACTIONS
// ============================================

export interface ActionResponse {
  success: boolean;
  error?: string;
}

export interface ActionResponseWithData<T> extends ActionResponse {
  data?: T;
}

// Alias pour les fonctions de lecture (plus explicite)
export type DataResponse<T> = ActionResponseWithData<T>;

// ============================================
// TYPES ROLES & PERMISSIONS
// ============================================

export interface Role {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  description: string | null;
  resource: string;
  action: string;
  createdAt: Date;
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

export interface RoleWithMembers extends Role {
  members: RoleMember[];
  memberCount: number;
}

export interface RoleMember {
  userId: string;
  userName: string;
  userEmail: string;
  userImage: string | null;
  assignedAt: Date;
}
export interface CreateRoleInput {
  name: string;
  description?: string;
  color?: string;
  priority?: number;
  permissionIds?: string[];
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  color?: string;
  priority?: number;
}

// ============================================
// TYPES WHITELIST
// ============================================

export interface WhitelistEntry {
  id: string;
  email: string;
  addedBy: string | null;
  createdAt: Date;
}

// ============================================
// TYPES CRÉATION MEMBRE
// ============================================

export interface CreateMemberInput {
  email: string;
  name: string;
  roleId: string;
  status: "active" | "pending";
}

// ============================================
// TYPES AUDIT
// ============================================

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  resourceName: string | null; // Nom de la ressource affectée (user, role, etc.)
  metadata: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface ListAuditLogsFilters {
  action?: AuditAction;
  resource?: AuditResource;
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

export interface ListAuditLogsResponse {
  logs: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}