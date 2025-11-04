# 🔐 Auth Template - Better Auth + Drizzle + PostgreSQL

> Template Next.js prêt à l'emploi avec authentification complète, sécurisée et moderne.

**Stack** : Next.js 16 • BetterAuth • Drizzle ORM • PostgreSQL • Shadcn UI • React Email • Resend

---

## ✨ Fonctionnalités

### ✅ Authentification de base
- [x] Sign in / Sign up par email/password
- [x] Email verification (avec toggle mock/real)
- [x] Forgot password / Reset password
- [x] Session management automatique
- [x] Protection des routes (proxy)
- [x] Remember me / Persistent sessions

### ✅ Gestion du profil
- [x] Modifier nom et email (avec verification email actuelle et nouvelle)
- [x] Changer le mot de passe
- [x] Supprimer le compte

### ✅ Sécurité
- [x] DAL (Data Access Layer) pour vérifier les sessions
- [x] DTO (Data Transfer Objects) pour ne pas exposer de données sensibles
- [x] Validation Zod sur tous les formulaires (client + serveur)
- [x] Tokens sécurisés pour reset password et email verification
- [x] CSRF protection (BetterAuth)

### ✅ UI/UX moderne
- [x] Interface responsive avec Shadcn UI
- [x] Formulaires avec React Hook Form + Zod
- [x] Loading states et Skeleton loaders
- [x] Toasts pour feedback utilisateur (Sonner)
- [x] Messages d'erreur clairs en français

### ✅ Emails
- [x] Templates professionnels avec React Email
- [x] Mode mock (console) par défaut
- [x] Support Resend (activation facile)
- [x] Toggle avec variable d'environnement

---

## 🚀 Installation rapide

### 1. Cloner le template

```bash
git clone https://github.com/votre-username/auth-template.git mon-projet
cd mon-projet
```

### 2. Installer les dépendances

```bash
pnpm install
```

### 3. Configuration

```bash
# Copier le fichier .env.example
cp .env.example .env

# Éditer le .env et remplir les variables
nano .env
```

**Variables essentielles** :
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/mydb"
BETTER_AUTH_SECRET="générer-avec-openssl-rand-base64-32"
BETTER_AUTH_URL="http://localhost:3000"
USE_REAL_EMAILS="false"  # Mode mock par défaut
```

### 4. Base de données

```bash
# Pousser le schéma vers la DB
pnpm drizzle-kit push

# Ou générer les migrations
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

### 5. Lancer le serveur

```bash
pnpm dev
```

🎉 Votre app est disponible sur http://localhost:3000

---

## 📧 Configuration des emails

### Mode Mock (par défaut)

Par défaut, les emails sont **affichés dans la console** (pas d'envoi réel).

✅ Parfait pour le développement
✅ Aucune configuration nécessaire
✅ Gratuit
✅ **Le lien de vérification/reset est clairement affiché** - copiez-collez directement depuis la console

### Activer Resend (emails réels)

1. **Créer un compte** sur [resend.com](https://resend.com) (gratuit - 100 emails/jour)
2. **Obtenir une clé API**
3. **Modifier le .env** :

```env
USE_REAL_EMAILS="true"
RESEND_API_KEY="re_votre_cle_api"
FROM_EMAIL="noreply@votredomaine.com"  # Optionnel
```

4. **Redémarrer le serveur**

🎉 Les emails seront envoyés avec Resend !

**Note** : En mode mock, les emails s'affichent dans la console avec le lien cliquable pour vérifier/réinitialiser. Exemple :
```
📧 ========== MOCK EMAIL ==========
📬 A: user@example.com
📝 Objet: Vérifiez votre adresse email

🔗 LIEN À COPIER-COLLER :
   http://localhost:3000/auth/verify-email?token=abc123...

💡 Copiez ce lien et collez-le dans votre navigateur
```

---

## 📁 Structure du projet

```
/
├── app/                        # Next.js App Router
│   ├── (application)/          # Routes protégées
│   │   ├── page.tsx            # Page d'accueil (profil)
│   │   └── settings/           # Paramètres utilisateur
│   ├── auth/                   # Pages d'authentification
│   │   ├── sign-in/
│   │   ├── sign-up/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   └── api/
│       └── auth/[...all]/      # API routes BetterAuth
│
├── components/
│   ├── auth/                   # Composants d'authentification
│   │   ├── sign-in-form.tsx
│   │   ├── sign-up-form.tsx
│   │   ├── forgot-password-form.tsx
│   │   └── reset-password-form.tsx
│   ├── settings/               # Composants settings
│   └── ui/                     # Shadcn UI components
│
├── lib/
│   ├── auth.ts                 # Configuration BetterAuth (serveur)
│   ├── auth-client.ts          # Client BetterAuth (React)
│   ├── dal.ts                  # ✅ Data Access Layer (sécurité)
│   ├── dto.ts                  # ✅ Data Transfer Objects
│   ├── email.ts                # Service d'envoi d'emails (toggle)
│   └── validations/            # Schémas Zod
│       ├── auth.ts
│       └── settings.ts
│
├── db/
│   ├── drizzle.ts              # Connexion DB
│   └── schema.ts               # Schéma Drizzle
│
├── server/
│   └── settings.ts             # Server Actions (profil, etc.)
│
├── emails/                     # ✅ Templates React Email
│   ├── email-verification.tsx
│   └── password-reset.tsx
│
├── proxy.ts                    # Middleware de protection des routes
├── .env.example                # Variables d'environnement
└── drizzle.config.ts           # Configuration Drizzle
```

---

## 🔒 Architecture de sécurité

### DAL (Data Access Layer)

Toutes les opérations sensibles passent par le DAL qui **vérifie la session**.

```typescript
// lib/dal.ts
export const verifySession = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Pas autorisé");
  return session;
});

// Utilisation dans une Server Action
export async function updateProfile(data) {
  const session = await verifySession(); // ✅ Vérifie automatiquement
  // ... suite du code
}
```

### DTO (Data Transfer Objects)

Les données utilisateur sont **filtrées** avant d'être envoyées au client.

```typescript
// lib/dto.ts
export function sanitizeUser(user: UserFromDB): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    // ❌ Ne JAMAIS exposer: password, tokens, updatedAt
  };
}
```

---

## 🎯 Utilisation dans vos projets

### Démarrer un nouveau projet

```bash
# 1. Copier le template
cp -r auth-template mon-nouveau-projet

# 2. Installer et configurer
cd mon-nouveau-projet
pnpm install
cp .env.example .env
nano .env

# 3. Setup DB
pnpm drizzle-kit push

# 4. Lancer
pnpm dev
```

### Personnaliser

1. **Changer le nom de l'app** : `package.json` et métadonnées
2. **Personnaliser les couleurs** : `app/globals.css` (variables CSS)
3. **Modifier les emails** : `emails/*.tsx`
4. **Ajouter des champs user** : `db/schema.ts`

---

## 📈 SCALING - Fonctionnalités avancées

> Comment faire évoluer ce template vers un SaaS complet

### 1. Gestion des rôles (RBAC)

**Modifier le schéma** :

```typescript
// db/schema.ts
export const user = pgTable("user", {
  // ... champs existants
  role: text("role", { enum: ["user", "admin", "pro"] })
    .default("user")
    .notNull(),
});
```

**Créer un middleware de permissions** :

```typescript
// lib/permissions.ts
export async function requireRole(role: "admin" | "pro") {
  const session = await verifySession();
  if (session.user.role !== role) {
    throw new Error("Accès refusé");
  }
}

// Utilisation
export async function deleteUser(userId: string) {
  await requireRole("admin"); // ✅ Vérifie le rôle
  // ... code
}
```

### 2. Multi-tenant (Organisations)

**Ajouter une table organization** :

```typescript
export const organization = pgTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const organizationMember = pgTable("organization_member", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").references(() => organization.id),
  userId: text("user_id").references(() => user.id),
  role: text("role", { enum: ["owner", "admin", "member"] }),
});
```

**Middleware organization** :

```typescript
export async function getOrganization(orgSlug: string) {
  const session = await verifySession();
  const org = await db.query.organization.findFirst({
    where: eq(organization.slug, orgSlug),
  });
  // Vérifier que l'utilisateur est membre
  // ...
}
```

### 3. Plans & Billing (Stripe)

**Ajouter des champs subscription** :

```typescript
export const user = pgTable("user", {
  // ... champs existants
  plan: text("plan", { enum: ["free", "pro", "enterprise"] })
    .default("free"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status"),
});
```

**Créer un service Stripe** :

```typescript
// lib/stripe.ts
import Stripe from "stripe";
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Webhooks
// app/api/webhooks/stripe/route.ts
```

### 4. Audit Logs

**Table audit_log** :

```typescript
export const auditLog = pgTable("audit_log", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => user.id),
  action: text("action").notNull(), // "user.created", "password.changed"
  metadata: text("metadata"), // JSON avec détails
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

**Helper pour logger** :

```typescript
// lib/audit.ts
export async function logAction(
  userId: string,
  action: string,
  metadata?: any
) {
  await db.insert(auditLog).values({
    id: crypto.randomUUID(),
    userId,
    action,
    metadata: JSON.stringify(metadata),
    createdAt: new Date(),
  });
}

// Utilisation
await logAction(session.user.id, "password.changed");
```

### 5. Rate Limiting

**Avec BetterAuth** :

```typescript
// lib/auth.ts
import { rateLimit } from "better-auth/plugins";

export const auth = betterAuth({
  // ...
  plugins: [
    rateLimit({
      window: 60, // 1 minute
      max: 5, // 5 requêtes max
      storage: "memory", // ou "redis"
    }),
  ],
});
```

### 6. Social Login (Google, GitHub)

```bash
pnpm add better-auth@latest
```

```typescript
// lib/auth.ts
export const auth = betterAuth({
  // ...
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },
});
```

### 7. 2FA / MFA

**Avec BetterAuth plugin** :

```typescript
import { twoFactor } from "better-auth/plugins";

export const auth = betterAuth({
  // ...
  plugins: [twoFactor()],
});
```

### 8. Upload d'avatar

**Avec UploadThing** :

```bash
pnpm add uploadthing @uploadthing/react
```

```typescript
// app/api/uploadthing/core.ts
import { createUploadthing } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: "4MB" } })
    .middleware(async () => {
      const session = await verifySession();
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Mettre à jour l'avatar dans la DB
      await db.update(user).set({ image: file.url });
    }),
};
```

---

## 🧪 Tests

```bash
# Tests unitaires (à ajouter)
pnpm test

# Tests E2E avec Playwright (à ajouter)
pnpm test:e2e
```

---

## 🚀 Déploiement

### Vercel (recommandé)

1. Push vers GitHub
2. Import sur [vercel.com](https://vercel.com)
3. Configurer les variables d'environnement
4. Deploy !

### Variables en production

```env
DATABASE_URL="postgresql://..."  # Votre DB production
BETTER_AUTH_SECRET="..."         # Nouveau secret sécurisé
BETTER_AUTH_URL="https://votredomaine.com"
USE_REAL_EMAILS="true"
RESEND_API_KEY="re_..."
FROM_EMAIL="noreply@votredomaine.com"
```

---

## 📚 Ressources

- [BetterAuth Docs](https://better-auth.com)
- [Drizzle ORM Docs](https://orm.drizzle.team)
- [Shadcn UI](https://ui.shadcn.com)
- [Resend](https://resend.com)
- [React Email](https://react.email)

---

## 📄 Licence

MIT

---

## 🙏 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une PR.
