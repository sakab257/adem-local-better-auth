# 📋 ANALYSE COMPLÈTE - PROJET NEXT.JS + BETTERAUTH + DRIZZLE

## 📊 SCORING GLOBAL: 4/10

---

## ✅ ÉTAT ACTUEL

### Infrastructure (8/10)
- ✅ Next.js 16 configuré
- ✅ BetterAuth installé et configuré
- ✅ Drizzle ORM avec PostgreSQL
- ✅ Route API d'authentification
- ✅ Server Actions basiques
- ⚠️ Pas de middleware de protection

### Database Schema (3/10)
- ✅ Tables de base BetterAuth (user, session, account, verification)
- ❌ Pas de gestion des rôles
- ❌ Pas de champs métier pour SaaS
- ❌ Pas de soft delete
- ❌ Pas de tracking avancé

### Authentification (3/10)
- ✅ Sign In / Sign Up email/password
- ❌ Pas de vérification d'email
- ❌ Pas de reset password
- ❌ Pas de social auth (Google, GitHub, etc.)
- ❌ Pas de 2FA

### UI/UX (1/10)
- ❌ Pas de pages (login, signup, dashboard, etc.)
- ❌ Pas de composants UI
- ❌ Pas de validation formulaire
- ❌ Pas de gestion d'erreurs user-friendly

### Sécurité (2/10)
- ❌ Pas de middleware de protection
- ❌ Pas de DAL (Data Access Layer)
- ❌ Pas de validation Zod
- ❌ Pas de rate limiting
- ❌ Pas de RBAC

---

## 🎯 PLAN D'AMÉLIORATION COMPLET

### PHASE 1: SCHÉMA DATABASE MODERNE (PRIORITÉ HAUTE)

#### 1.1 Améliorer la table `user`

```typescript
// db/schema.ts - Version améliorée
import { pgTable, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";

// Enum pour les rôles utilisateur
export const roleEnum = pgEnum('role', ['user', 'admin', 'super_admin']);

// Enum pour les plans SaaS
export const planEnum = pgEnum('plan', ['free', 'starter', 'pro', 'enterprise']);

// Enum pour le statut utilisateur
export const userStatusEnum = pgEnum('user_status', ['active', 'suspended', 'banned', 'pending']);

export const user = pgTable("user", {
  // Colonnes existantes
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),

  // NOUVELLES COLONNES ESSENTIELLES

  // Gestion des rôles et permissions
  role: roleEnum('role').default('user').notNull(),

  // Statut du compte
  status: userStatusEnum('status').default('active').notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  isBanned: boolean("is_banned").default(false).notNull(),

  // Vérification email avec date
  emailVerifiedAt: timestamp("email_verified_at"),

  // SaaS - Plan et organisation
  plan: planEnum('plan').default('free').notNull(),
  planExpiresAt: timestamp("plan_expires_at"),
  organizationId: text("organization_id"), // Pour multi-tenant

  // Tracking utilisateur
  lastLoginAt: timestamp("last_login_at"),
  lastLoginIp: text("last_login_ip"),
  loginCount: integer("login_count").default(0).notNull(),

  // Profil utilisateur enrichi
  phone: text("phone"),
  bio: text("bio"),
  locale: text("locale").default('fr').notNull(),
  timezone: text("timezone").default('Europe/Paris'),

  // Préférences
  notificationsEnabled: boolean("notifications_enabled").default(true).notNull(),
  marketingEmailsEnabled: boolean("marketing_emails_enabled").default(false).notNull(),

  // Soft delete
  deletedAt: timestamp("deleted_at"),
  deletedBy: text("deleted_by"),

  // Métadonnées
  metadata: jsonb("metadata"), // Pour données flexibles

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
```

#### 1.2 Créer une table `organization` (Multi-tenant)

```typescript
export const organization = pgTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),

  // Owner de l'organisation
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  // Plan et limites
  plan: planEnum('plan').default('free').notNull(),
  planExpiresAt: timestamp("plan_expires_at"),

  // Limites SaaS
  maxMembers: integer("max_members").default(5).notNull(),
  maxProjects: integer("max_projects").default(3).notNull(),

  // Statut
  isActive: boolean("is_active").default(true).notNull(),

  // Billing
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),

  // Métadonnées
  metadata: jsonb("metadata"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  deletedAt: timestamp("deleted_at"),
});
```

#### 1.3 Table `organization_member` (Relations)

```typescript
export const organizationRoleEnum = pgEnum('organization_role', ['owner', 'admin', 'member', 'viewer']);

export const organizationMember = pgTable("organization_member", {
  id: text("id").primaryKey(),

  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),

  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  role: organizationRoleEnum('role').default('member').notNull(),

  // Invitation
  invitedBy: text("invited_by").references(() => user.id),
  invitedAt: timestamp("invited_at"),
  acceptedAt: timestamp("accepted_at"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
```

#### 1.4 Table `password_reset` (Sécurité)

```typescript
export const passwordReset = pgTable("password_reset", {
  id: text("id").primaryKey(),

  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  token: text("token").notNull().unique(),

  expiresAt: timestamp("expires_at").notNull(),

  usedAt: timestamp("used_at"),

  ipAddress: text("ip_address"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

#### 1.5 Table `audit_log` (Traçabilité)

```typescript
export const auditLog = pgTable("audit_log", {
  id: text("id").primaryKey(),

  userId: text("user_id").references(() => user.id),

  action: text("action").notNull(), // "user.login", "user.created", etc.

  entityType: text("entity_type"), // "user", "organization", etc.
  entityId: text("entity_id"),

  metadata: jsonb("metadata"),

  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

---

### PHASE 2: ARCHITECTURE SÉCURISÉE

#### 2.1 DAL (Data Access Layer)

```typescript
// lib/dal.ts
import "server-only";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { cache } from "react";

export const verifySession = cache(async () => {
  const session = await auth.api.getSession({
    headers: await cookies(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  return { isAuth: true, userId: session.user.id, session };
});

export const getUser = cache(async () => {
  const session = await verifySession();

  if (!session) {
    return null;
  }

  const user = await db.query.user.findFirst({
    where: (user, { eq, isNull }) =>
      and(eq(user.id, session.userId), isNull(user.deletedAt)),
  });

  return user;
});
```

#### 2.2 DTO (Data Transfer Objects)

```typescript
// lib/dto.ts
import { user } from "@/db/schema";

export type UserDTO = {
  id: string;
  name: string;
  email: string;
  role: string;
  plan: string;
  // Ne jamais exposer: password, tokens, etc.
};

export function toUserDTO(user: typeof user.$inferSelect): UserDTO {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    plan: user.plan,
  };
}
```

#### 2.3 Middleware de protection

```typescript
// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const publicRoutes = ["/", "/signin", "/signup", "/forgot-password"];
const authRoutes = ["/signin", "/signup"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Vérifier la session
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  const isLoggedIn = !!session;

  // Rediriger les utilisateurs non-connectés
  if (!isLoggedIn && !publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  // Rediriger les utilisateurs connectés qui accèdent aux pages d'auth
  if (isLoggedIn && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

---

### PHASE 3: FONCTIONNALITÉS AUTHENTIFICATION

#### 3.1 Vérification d'email

Configuration BetterAuth:
```typescript
// lib/auth.ts
import { emailOTP } from "better-auth/plugins";

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true, // IMPORTANT
  },

  plugins: [
    nextCookies(),
    emailOTP(), // Plugin de vérification email
  ],

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
  },
});
```

#### 3.2 Reset Password

```typescript
// server/auth.ts
export const forgotPassword = async (email: string) => {
  try {
    await auth.api.forgetPassword({
      body: { email },
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: "Email non trouvé" };
  }
};

export const resetPassword = async (token: string, newPassword: string) => {
  try {
    await auth.api.resetPassword({
      body: { token, newPassword },
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: "Token invalide ou expiré" };
  }
};
```

#### 3.3 Social Auth (Google, GitHub)

```typescript
// lib/auth.ts
import { github, google } from "better-auth/social-providers";

export const auth = betterAuth({
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },

  // ...
});
```

---

### PHASE 4: UI/UX MODERNE

#### 4.1 Pages à créer

1. **`app/(auth)/signin/page.tsx`** - Page de connexion
2. **`app/(auth)/signup/page.tsx`** - Page d'inscription
3. **`app/(auth)/forgot-password/page.tsx`** - Mot de passe oublié
4. **`app/(auth)/reset-password/page.tsx`** - Réinitialiser mot de passe
5. **`app/(auth)/verify-email/page.tsx`** - Vérification email
6. **`app/(dashboard)/dashboard/page.tsx`** - Dashboard utilisateur
7. **`app/(dashboard)/settings/page.tsx`** - Paramètres utilisateur
8. **`app/(dashboard)/settings/profile/page.tsx`** - Profil
9. **`app/(dashboard)/settings/security/page.tsx`** - Sécurité
10. **`app/(dashboard)/settings/billing/page.tsx`** - Facturation

#### 4.2 Composants à créer

1. **`components/auth/signin-form.tsx`** - Formulaire connexion
2. **`components/auth/signup-form.tsx`** - Formulaire inscription
3. **`components/auth/forgot-password-form.tsx`**
4. **`components/auth/reset-password-form.tsx`**
5. **`components/dashboard/header.tsx`** - Header dashboard
6. **`components/dashboard/sidebar.tsx`** - Sidebar navigation
7. **`components/dashboard/user-menu.tsx`** - Menu utilisateur

#### 4.3 Validation avec Zod

```typescript
// lib/validations/auth.ts
import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Au moins 8 caractères"),
});

export const signUpSchema = z.object({
  name: z.string().min(2, "Nom trop court"),
  email: z.string().email("Email invalide"),
  password: z.string()
    .min(8, "Au moins 8 caractères")
    .regex(/[A-Z]/, "Au moins une majuscule")
    .regex(/[a-z]/, "Au moins une minuscule")
    .regex(/[0-9]/, "Au moins un chiffre"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});
```

---

### PHASE 5: FONCTIONNALITÉS SAAS AVANCÉES

#### 5.1 Gestion des rôles et permissions

```typescript
// lib/permissions.ts
import "server-only";

type Role = 'user' | 'admin' | 'super_admin';
type Permission = 'user.read' | 'user.write' | 'admin.access' | 'billing.manage';

const rolePermissions: Record<Role, Permission[]> = {
  user: ['user.read'],
  admin: ['user.read', 'user.write', 'admin.access'],
  super_admin: ['user.read', 'user.write', 'admin.access', 'billing.manage'],
};

export async function hasPermission(permission: Permission): Promise<boolean> {
  const user = await getUser();

  if (!user) return false;

  const permissions = rolePermissions[user.role as Role];
  return permissions.includes(permission);
}

export async function requirePermission(permission: Permission): Promise<void> {
  const allowed = await hasPermission(permission);

  if (!allowed) {
    throw new Error("Insufficient permissions");
  }
}
```

#### 5.2 Webhooks & Events

```typescript
// lib/events.ts
import { db } from "@/db/drizzle";
import { auditLog } from "@/db/schema";
import { nanoid } from "nanoid";

export async function logEvent(event: {
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}) {
  await db.insert(auditLog).values({
    id: nanoid(),
    ...event,
  });
}
```

#### 5.3 Notifications Email

```typescript
// lib/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;

  await resend.emails.send({
    from: 'noreply@votreapp.com',
    to: email,
    subject: 'Vérifiez votre adresse email',
    html: `<p>Cliquez <a href="${verificationUrl}">ici</a> pour vérifier votre email.</p>`,
  });
}
```

---

## 📦 DÉPENDANCES RECOMMANDÉES

```json
{
  "dependencies": {
    "better-auth": "^1.3.34",
    "drizzle-orm": "^0.44.7",
    "zod": "^3.23.8",
    "react-hook-form": "^7.53.2",
    "@hookform/resolvers": "^3.9.1",
    "sonner": "^1.7.2",
    "nanoid": "^5.0.9",
    "resend": "^4.0.3",
    "@radix-ui/react-dropdown-menu": "^2.1.4",
    "@radix-ui/react-dialog": "^1.1.4",
    "@radix-ui/react-select": "^2.1.4"
  }
}
```

---

## 🎯 ROADMAP RECOMMANDÉE

### Sprint 1 (Semaine 1-2): Foundation
- [ ] Améliorer le schéma database
- [ ] Créer les migrations
- [ ] Implémenter le DAL
- [ ] Créer le middleware

### Sprint 2 (Semaine 3-4): Auth Core
- [ ] Pages signin/signup
- [ ] Validation Zod
- [ ] Vérification email
- [ ] Reset password

### Sprint 3 (Semaine 5-6): Dashboard
- [ ] Layout dashboard
- [ ] Page settings
- [ ] Gestion profil
- [ ] Notifications

### Sprint 4 (Semaine 7-8): Advanced
- [ ] Gestion des rôles
- [ ] Multi-tenant (organisations)
- [ ] Audit logs
- [ ] Social auth

### Sprint 5 (Semaine 9-10): SaaS Features
- [ ] Plans & pricing
- [ ] Stripe integration
- [ ] Webhooks
- [ ] Analytics

---

## 🔒 CHECKLIST SÉCURITÉ

- [ ] Validation Zod sur tous les formulaires
- [ ] DAL pour vérifier les sessions
- [ ] Middleware de protection des routes
- [ ] Rate limiting sur les endpoints sensibles
- [ ] CSRF protection (BetterAuth l'inclut)
- [ ] Sanitization des inputs
- [ ] Logs d'audit pour actions sensibles
- [ ] Soft delete pour garder l'historique
- [ ] Environnement variables sécurisées
- [ ] HTTPS en production

---

## 📚 RESSOURCES

- [Better Auth Docs](https://better-auth.com)
- [Drizzle ORM Docs](https://orm.drizzle.team)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Shadcn UI](https://ui.shadcn.com)
- [Zod Validation](https://zod.dev)

---

**Dernière mise à jour**: 2 Novembre 2025
