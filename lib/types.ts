/**
 * Types partagés pour l'application ADEM
 */

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

// ============================================
// TYPES WHITELIST
// ============================================

export interface WhitelistEntry {
  id: string;
  email: string;
  addedBy: string | null;
  createdAt: Date;
}
