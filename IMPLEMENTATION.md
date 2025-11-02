# Better Auth + Drizzle + PostgreSQL - Guide d'implémentation

## Table des matières
1. [Installation des dépendances](#1-installation-des-dépendances)
2. [Configuration de l'environnement](#2-configuration-de-lenvironnement)
3. [Configuration de Drizzle](#3-configuration-de-drizzle)
4. [Configuration de Better Auth](#4-configuration-de-better-auth)
5. [Création de la route API](#5-création-de-la-route-api)
6. [Configuration du client Auth](#6-configuration-du-client-auth)
7. [Middleware de protection des routes](#7-middleware-de-protection-des-routes)
8. [Server Actions](#8-server-actions)
9. [Interface utilisateur](#9-interface-utilisateur)
10. [Prochaines étapes](#10-prochaines-étapes)

---

## 1. Installation des dépendances

### Better Auth
```bash
pnpm add better-auth
```

### Drizzle + PostgreSQL
```bash
pnpm add drizzle-orm pg dotenv
pnpm add -D drizzle-kit tsx @types/pg
```

### Shadcn UI
```bash
pnpm dlx shadcn@latest init
```

---

## 2. Configuration de l'environnement

Créer le fichier `.env` à la racine du projet :

### Générer le secret Better Auth
```bash
pnpm dlx @better-auth/cli@latest secret
```

### Variables d'environnement
```env
# Auth
BETTER_AUTH_SECRET=<généré par la commande ci-dessus>
BETTER_AUTH_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@host:port/db-name
```

> **Note:** En production ou sur VPS, modifier `BETTER_AUTH_URL` avec l'URL réelle.

---

## 3. Configuration de Drizzle

### 3.1 Créer la connexion à la base de données

**Fichier:** `db/drizzle.ts`

```typescript
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';

export const db = drizzle(process.env.DATABASE_URL!);
```

> **Référence:** [Drizzle - Get Started with PostgreSQL](https://orm.drizzle.team/docs/get-started/postgresql-new) (Étape 3)

### 3.2 Générer le schéma Better Auth

```bash
pnpm dlx @better-auth/cli generate
```

Cette commande génère un fichier `schema.ts` avec toutes les tables nécessaires pour Better Auth.

**Déplacer le contenu généré** dans `db/schema.ts` puis **supprimer le fichier temporaire**.

### 3.3 Exporter le schéma

**Ajouter à la fin de** `db/schema.ts` :

```typescript
export const schema = { user, session, account, verification };
```

### 3.4 Configuration Drizzle Kit

**Fichier:** `drizzle.config.ts`

```typescript
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './migrations',
  schema: './db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

> **Référence:** [Drizzle - Get Started with PostgreSQL](https://orm.drizzle.team/docs/get-started/postgresql-new) (Étape 5)

### 3.5 Pousser le schéma vers la base de données

```bash
pnpm drizzle-kit push
```

Cette commande crée toutes les tables dans votre base de données PostgreSQL.

---

## 4. Configuration de Better Auth

**Fichier:** `lib/auth.ts`

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db/drizzle";
import { schema } from "@/db/schema";

export const auth = betterAuth({
  // Activation de l'authentification par email/mot de passe
  emailAndPassword: {
    enabled: true,
  },

  // Connexion à la base de données via Drizzle
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),

  // Plugin pour Next.js (gestion des cookies)
  plugins: [nextCookies()],
});
```

---

## 5. Création de la route API

**Fichier:** `app/api/auth/[...all]/route.ts`

```typescript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { POST, GET } = toNextJsHandler(auth);
```

Cette route gère toutes les requêtes d'authentification (signin, signup, signout, etc.).

---

## 6. Configuration du client Auth

**Fichier:** `lib/auth-client.ts`

```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: "http://localhost:3000",
});
```

Ce client sera utilisé côté client pour interagir avec l'API d'authentification.

---

## 7. Middleware de protection des routes

**Fichier:** `middleware.ts` (à la racine du projet)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  // ATTENTION: Ceci n'est pas 100% sécurisé!
  // Approche recommandée pour rediriger de manière optimiste
  // Il est conseillé de vérifier l'auth dans chaque page/route
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard"], // Routes protégées
};
```

---

## 8. Server Actions

**Fichier:** `server/user.ts`

```typescript
"use server";

import { auth } from "@/lib/auth";

/**
 * Connexion d'un utilisateur existant
 */
export const signIn = async (email: string, password: string) => {
  try {
    await auth.api.signInEmail({
      body: {
        email,
        password,
      },
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: "Identifiants invalides" };
  }
};

/**
 * Inscription d'un nouvel utilisateur
 */
export const signUp = async (email: string, password: string, name: string) => {
  try {
    await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: "Erreur lors de l'inscription" };
  }
};
```

---

## 9. Interface utilisateur

### 9.1 Installer le composant de login Shadcn

```bash
pnpm dlx shadcn@latest add login-03
```

### 9.2 Modification du formulaire de connexion

- Changer le type du bouton en `button` (au lieu de `submit`)
- Ajouter `onClick={handleSignIn}` sur le bouton
- Connecter les inputs avec un state React
- Appeler la fonction `signIn` depuis `@/server/user`

### 9.3 Page d'inscription (À CRÉER)

**Structure suggérée pour** `app/signup/page.tsx` :

```typescript
"use client";

import { useState } from "react";
import { signUp } from "@/server/user";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSignUp = async () => {
    const result = await signUp(email, password, name);

    if (result.success) {
      // Rediriger vers le dashboard ou la page de connexion
      router.push("/dashboard");
    } else {
      // Afficher un toast d'erreur
      console.error(result.error);
    }
  };

  return (
    <div>
      {/* Formulaire d'inscription à créer */}
    </div>
  );
}
```

---

## 10. État d'avancement

### ✅ Fonctionnalités implémentées

#### Validation des formulaires
- [x] Intégrer **Zod** pour la validation des données
- [x] Créer des schémas de validation pour signin (login-form.tsx:38-41)
- [x] Afficher les erreurs de validation côté client

#### Notifications utilisateur
- [x] Implémenter **Toast** (Sonner) pour les messages de succès/erreur
- [x] Afficher des messages lors de la connexion/déconnexion
- [x] Gérer les erreurs de manière user-friendly

#### Dashboard et déconnexion
- [x] Créer une page dashboard avec UI professionnelle (app/dashboard/page.tsx)
- [x] Implémenter la déconnexion avec bouton et toast
- [x] Afficher les informations utilisateur (nom, email)
- [x] Améliorer le middleware pour mieux gérer les redirections

#### Middleware intelligent
- [x] Rediriger les utilisateurs non-connectés vers "/" quand ils essaient d'accéder au dashboard
- [x] Rediriger les utilisateurs connectés vers "/dashboard" quand ils essaient d'accéder à "/"
- [x] Protéger automatiquement les routes sensibles

#### Server Actions
- [x] Fonction `signIn` avec gestion d'erreurs (server/user.ts:4-24)
- [x] Fonction `signUp` avec gestion d'erreurs (server/user.ts:26-46)
- [x] Fonction `signOut` avec gestion d'erreurs (server/user.ts:48-63)

#### Page d'inscription
- [x] Créer `app/signup/page.tsx`
- [x] Créer un composant de formulaire d'inscription réutilisable (components/signup-form.tsx)
- [x] Ajouter la validation Zod avec confirmation de mot de passe (signup-form.tsx:36-44)
- [x] Lier les pages login et signup entre elles
- [x] Implémenter les toasts pour les messages de succès/erreur
- [x] Ajouter la redirection automatique vers "/" après inscription réussie
- [x] Middleware : rediriger les utilisateurs connectés qui essaient d'accéder à /signup

### 🚧 Prochaines étapes

#### Améliorations de sécurité
- [ ] Ajouter la vérification d'email
- [ ] Implémenter le "Mot de passe oublié"
- [ ] Ajouter une page de réinitialisation de mot de passe
- [ ] Implémenter la limitation de tentatives de connexion (rate limiting)

#### Fonctionnalités utilisateur
- [ ] Créer une page de profil utilisateur
- [ ] Permettre la modification du profil (nom, email, mot de passe)
- [ ] Ajouter un avatar utilisateur
---

## Ressources

- [Better Auth Documentation](https://better-auth.com)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Shadcn UI Components](https://ui.shadcn.com)
- [Next.js App Router](https://nextjs.org/docs/app)