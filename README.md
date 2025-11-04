# ADEM - Association Dauphinoise des Étudiants Musulmans

Web-app pour la gestion et les ressources de l'association ADEM.

## 📊 État du Projet

**Score Global : 5.5/10** (55/100)

**Statut** : Fondations d'authentification solides, mais RBAC et fonctionnalités métier absentes.

| Catégorie | Score | État |
|-----------|-------|------|
| Architecture & Structure | 8/10 | ✅ Bien organisé |
| Authentification (Better-Auth) | 6/10 | ⚠️ Base OK, Admin plugin manquant |
| Base de données (Drizzle) | 5/10 | ⚠️ Schéma OK, migrations absentes |
| Sécurité | 7/10 | ⚠️ Auth OK, RBAC absent |
| Fonctionnalités | 3/10 | ❌ Seulement auth/settings |
| DevX & Tooling | 4/10 | ❌ Scripts DB manquants |

---

## 🛠️ Stack Technique

- **Framework** : Next.js 16 (App Router) + React 19
- **Langage** : TypeScript (strict mode)
- **Base de données** : PostgreSQL + Drizzle ORM 0.44.7
- **Authentification** : Better-Auth 1.3.34
- **Validation** : Zod 4.1.12 + React Hook Form
- **UI** : shadcn/ui + Radix UI + Tailwind CSS 4 (thème OKLCH)
- **Emails** : Resend + React Email (+ mode Mock dev)
- **Icons** : Lucide React

---

## ✅ Fonctionnalités Implémentées

### Authentification
- ✅ Inscription avec email/password (validation Zod)
- ✅ Connexion avec gestion d'erreurs (email non vérifié, credentials invalides)
- ✅ Vérification email obligatoire (envoi automatique)
- ✅ Reset password avec email
- ✅ Changement email (vérification sur ancien email pour sécurité)
- ✅ Rate limiting (5 tentatives/60s)
- ✅ Déconnexion

### Paramètres Utilisateur
- ✅ Modification nom
- ✅ Modification email (avec re-vérification)
- ✅ Changement mot de passe (avec regex : maj + min + chiffre)
- ✅ Suppression de compte (avec confirmation AlertDialog)

### Sécurité
- ✅ Middleware de protection routes (redirect si non connecté)
- ✅ Blocage si email non vérifié
- ✅ Data Access Layer (`verifySession()`) pour server actions
- ✅ DTO (`sanitizeUser()`) pour exposer uniquement données publiques
- ✅ Cascade delete (sessions/accounts supprimés avec l'utilisateur)

### UI/UX
- ✅ Sidebar responsive avec navigation organisée par sections
- ✅ Header avec SidebarTrigger
- ✅ Dark mode / Light mode (next-themes)
- ✅ Toast notifications (Sonner)
- ✅ 19 composants shadcn/ui installés
- ✅ Layout App Router avec route groups

### Emails
- ✅ Service email avec mode Mock (dev) et Resend (prod)
- ✅ Templates React Email (verification + reset password)
- ✅ Extraction automatique des liens de vérification en mode Mock

---

## ❌ Ce qui Manque (Bloquants)

### Critique (P0 - Bloquants)
1. **❌ Migrations Drizzle** : Aucune migration créée/appliquée → DB non synchronisée
2. **❌ Scripts DB** : `db:generate`, `db:migrate`, `db:push`, `db:seed`, `db:studio` absents
3. **❌ Better-Auth Admin Plugin** : Non configuré (server + client)
4. **❌ Tables RBAC** : `roles`, `permissions`, `rolePermissions`, `userRoles` manquantes
5. **❌ Seed initial** : Pas de données de démarrage (rôles ADEM, permissions, admin)

### Important (P1 - Architecture)
6. **❌ Guards RBAC** : `hasRole(user, 'Admin')` et `can(user, 'permission')` absents
7. **❌ Middleware RBAC** : Pas de protection `/admin/**` ou `/bureau/**` par rôle
8. **❌ Table `auditLogs`** : Traçabilité des actions admin manquante
9. **❌ Table `orgUnits`** : Hiérarchie Année/Filière/Matière pour ressources
10. **❌ Enum `userStatus`** : Statuts ADEM (Active, En attente, etc.)

### Fonctionnalités Métier (P2)
11. **❌ Gestion Membres** : CRUD utilisateurs (list, filters, set role, reset pwd, ban/unban)
12. **❌ Gestion Rôles** : CRUD rôles/permissions style Discord
13. **❌ Invitations** : Import CSV/XLSX/TXT avec preview + whitelist
14. **❌ Dashboard** : Citation du jour, KPIs, événements, tâches, quick actions
15. **❌ Calendrier** : CRUD événements (Admin/Bureau/CA)
16. **❌ Tâches** : Kanban personnel + chart progression
17. **❌ Cours** : Hiérarchie + éditeur Tiptap + workflow validation (3 Correctors + SuperCorrector)
18. **❌ Exercices** : Par TD/matière/filière avec indices & corrections
19. **❌ Annales** : Mode simulation examen avec minuteur
20. **❌ Feedback** : Formulaire de retour utilisateurs

### DevX & Qualité (P3)
21. **❌ Tests** : Aucun test (unitaire, intégration, e2e)
22. **❌ Documentation** : Fonctions et composants non documentés
23. **❌ CI/CD** : Pas de pipeline
24. **❌ Monitoring** : Pas de logging/alerting

---

## 🚀 Prochaines Étapes (Ordre Recommandé)

### Phase 1 : RBAC & Admin (Priorité MAX)
**Objectif** : Débloquer la gestion des utilisateurs et permissions

1. **Créer les migrations Drizzle RBAC**
   ✅ Tables : `roles`, `permissions`, `rolePermissions`, `userRoles`, `userStatus`, `auditLogs`, `orgUnits`
   ✅ Scripts : `pnpm db:generate` → `pnpm db:migrate`

2. **Seed initial RBAC**
   ✅ Rôles ADEM : Admin, Moderateur, Bureau, CA, SuperCorrecteur, Correcteur, Membre, En attente
   ✅ Permissions granulaires : `events:create`, `resources:approve`, `members:invite`, etc.
   ✅ Script : `pnpm db:seed` + `pnpm admin:promote <email>` pour créer 1er admin

3. **Intégrer Better-Auth Admin Plugin**
   ✅ Server : `admin()` plugin dans `lib/auth.ts`
   ✅ Client : `adminClient()` plugin dans `lib/auth-client.ts`
   ✅ Migration : `npx @better-auth/cli migrate`

4. **Policy Layer & Guards**
   ✅ Utils : `hasRole(user, 'Admin')`, `can(user, 'permission')`
   - Server actions : Guards dans toutes les actions sensibles
   - Middleware : Protection `/admin/**` et `/bureau/**` par rôle

5. **Pages Admin**
   - `/admin/members` : Table filtrable/triable, actions inline (set role, reset pwd, ban)
   - `/admin/roles` : CRUD rôles/permissions style Discord
   - Server actions : `createUser`, `listUsers`, `updateUser`, `setRole`, `banUser`, etc.

**Durée estimée** : 3-5 jours
**Délivrables** : RBAC complet + gestion membres/rôles fonctionnelle

---

### Phase 2 : Invitations & Whitelist (Bureau/CA)
**Objectif** : Permettre l'onboarding massif des membres

1. **Parser CSV/XLSX/TXT**
   - Upload → parsing → validation → preview (table avec erreurs en rouge)
   - Colonnes : email, role, status

2. **Batch Import**
   - Commit en transaction
   - Auto-assign role + status si match whitelist à l'inscription

3. **Page Bureau/CA**
   - `/bureau/invitations` : Upload + preview + import
   - `/bureau/add-member` : Création unique + envoi OTP + force reset on first login

**Durée estimée** : 2-3 jours

---

### Phase 3 : Ressources (Cours, Exercices, Annales)
**Objectif** : MVP éditeur + workflow validation

1. **Tables DB**
   - `courses`, `chapters`, `exercises`, `exams`, `validations`

2. **Éditeur Tiptap**
   - Extensions : annotations, code blocks, footnotes
   - Save/auto-save

3. **Workflow Validation**
   - 3 validations Corrector → publié
   - Bypass SuperCorrector
   - Notifications (optionnel)

**Durée estimée** : 5-7 jours

---

### Phase 4 : Dashboard & Calendrier
**Objectif** : MVP dashboard + gestion événements

1. **Dashboard**
   - Citation du jour (API externe ou DB)
   - 4 KPI cards (membres, événements à venir, ressources, tâches complétées)
   - Prochains événements (3 cards avec inscription)
   - Tâches récentes (3 dernières)
   - Quick actions (boutons raccourcis)

2. **Calendrier**
   - CRUD événements (Admin/Bureau/CA only)
   - Inscriptions membres
   - Notifications (optionnel)

**Durée estimée** : 3-4 jours

---

### Phase 5 : Tâches & Feedback
**Objectif** : Kanban perso + retour utilisateurs

1. **Tâches**
   - Kanban personnel (To Do / In Progress / Done)
   - Chart progression (% complété)

2. **Feedback**
   - Formulaire simple (titre, description, type)
   - Stockage DB ou email vers admins

**Durée estimée** : 2-3 jours

---

## 🏗️ Structure du Projet

```
/
├── app/                        # Next.js 16 App Router
│   ├── (application)/         # Routes protégées avec sidebar
│   │   ├── page.tsx           # Dashboard (vide)
│   │   └── settings/          # Paramètres utilisateur ✅
│   ├── auth/                  # Routes d'authentification ✅
│   │   ├── sign-in/
│   │   ├── sign-up/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   └── api/auth/[...all]/     # Better-Auth API handler ✅
│
├── components/
│   ├── auth/                  # Forms auth (5 composants) ✅
│   ├── settings/              # Forms settings (3 composants) ✅
│   ├── ui/                    # shadcn/ui (19 composants) ✅
│   ├── themes/                # Dark/Light mode ✅
│   ├── app-sidebar.tsx        # Sidebar principale ✅
│   ├── links-sidebar.tsx      # Navigation organisée ✅
│   └── app-header.tsx         # Header ✅
│
├── db/
│   ├── schema.ts              # Schéma Drizzle (4 tables) ✅
│   └── drizzle.ts             # Instance DB ✅
│
├── lib/
│   ├── auth.ts                # Better-Auth server config ✅
│   ├── auth-client.ts         # Better-Auth client ✅
│   ├── dal.ts                 # verifySession guard ✅
│   ├── dto.ts                 # sanitizeUser ✅
│   ├── email.ts               # Service email (Mock + Resend) ✅
│   ├── validations/           # Schémas Zod ✅
│   └── utils.ts               # Utilitaires (cn) ✅
│
├── server/
│   └── settings.ts            # deleteAccount server action ✅
│
├── emails/                    # Templates React Email ✅
├── migrations/                # ❌ VIDE (à créer)
├── proxy.ts                   # Middleware Next.js ✅
├── drizzle.config.ts          # Config Drizzle ✅
└── package.json               # Dépendances ✅
```

---

## 🚀 Installation & Setup

### Prérequis
- Node.js 20+
- pnpm 9+
- PostgreSQL 14+

### 1. Cloner le repo
```bash
git clone <repo-url>
cd adem-local-better-auth
```

### 2. Installer les dépendances
```bash
pnpm install
```

### 3. Configurer les variables d'environnement
```bash
cp .env.example .env
```

Éditer `.env` :
```bash
# PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/adem"

# Better-Auth
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_SECRET="généré_avec_openssl_rand_base64_32"

# Emails
USE_REAL_EMAILS="false"              # false = Mock, true = Resend
RESEND_API_KEY="re_xxx"              # Optionnel si Mock
FROM_EMAIL="noreply@adem.fr"
```

### 4. Créer la base de données
```bash
psql -U postgres
CREATE DATABASE adem;
\q
```

### 5. ⚠️ Générer et appliquer les migrations (À FAIRE)
```bash
# Actuellement MANQUANT - à implémenter en Phase 1
pnpm db:generate
pnpm db:migrate
```

### 6. Lancer le serveur de développement
```bash
pnpm dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

---

## 📜 Scripts Disponibles

### Actuels
```bash
pnpm dev          # Serveur de développement Next.js
pnpm build        # Build production
pnpm start        # Serveur production
pnpm lint         # ESLint
```

### À Ajouter (Phase 1)
```bash
pnpm db:generate  # Générer migrations Drizzle depuis schema.ts
pnpm db:migrate   # Appliquer migrations en DB
pnpm db:push      # Push schema sans migration (dev rapide)
pnpm db:seed      # Seed rôles/permissions/admin initial
pnpm db:studio    # Drizzle Studio (GUI DB)
pnpm admin:promote <email>  # Promouvoir un user en Admin
```

---

## 🔐 Sécurité

### Implémentée
- ✅ Middleware de protection routes (redirect si non connecté)
- ✅ Vérification email obligatoire
- ✅ Rate limiting (5 req/60s)
- ✅ Cascade delete (sessions/accounts)
- ✅ Server-side session checks (`verifySession()`)
- ✅ DTO pour sanitize données utilisateur
- ✅ Password hashing (Better-Auth bcrypt)
- ✅ Regex password fort (maj + min + chiffre)

### À Implémenter
- ⚠️ Guards RBAC (hasRole, can)
- ⚠️ Audit logs (qui a fait quoi, quand)
- ⚠️ Protection endpoints par rôle
- ⚠️ CSRF tokens (Better-Auth le gère nativement mais vérifier)
- ⚠️ Rate limiting sur server actions sensibles

### Risques Identifiés
1. **Élévation de privilèges** : Sans RBAC, impossible de limiter l'accès aux fonctions admin
2. **Endpoint leakage** : Routes `/admin/**` et `/bureau/**` non protégées par rôle actuellement
3. **Pas d'audit trail** : Impossible de tracer les actions sensibles (changement de rôle, ban, etc.)

**Mitigation (Phase 1)** : Implémenter RBAC complet + audit logs + guards sur toutes les server actions sensibles.

---

## 🎯 Conventions de Code

### Nomenclature
- **Fichiers** : `kebab-case.tsx` (ex: `members-table.tsx`)
- **Fonctions** : `camelCase` en anglais (ex: `deleteAccount`, `verifySession`)
- **Composants** : `PascalCase` (ex: `SignInForm`)
- **Contenu UI** : Texte affiché en **français** pour les utilisateurs

### Organisation
- **Server Actions** : `/server/*.ts` avec `"use server"`
- **Composants Client** : `components/*.tsx` avec `"use client"` si nécessaire
- **Validations** : `/lib/validations/*.ts` avec schémas Zod
- **Types** : Co-localisés ou dans `/lib/types.ts` si partagés

---

## 📖 Documentation Technique

### Better-Auth
- [Docs officielles](https://www.better-auth.com/docs)
- [Plugin Admin](https://www.better-auth.com/docs/plugins/admin) - À intégrer Phase 1
- [Drizzle Adapter](https://www.better-auth.com/docs/concepts/database)

### Drizzle ORM
- [Docs officielles](https://orm.drizzle.team/docs/overview)
- [PostgreSQL](https://orm.drizzle.team/docs/get-started-postgresql)
- [Migrations](https://orm.drizzle.team/docs/migrations)

### Next.js 16
- [App Router](https://nextjs.org/docs/app)
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)

---

## 🤝 Contribution

1. Respecter les conventions de nommage
2. Toujours utiliser TypeScript strict
3. Valider avec Zod côté client ET serveur
4. Tester manuellement avant commit
5. Documenter les fonctions non triviales

---

## 📝 Notes Importantes

### Rôles ADEM (8 rôles)
1. **Admin** : Accès total
2. **Moderateur** : Modération contenu + membres
3. **Bureau** : Gestion événements + invitations
4. **CA** : Gestion événements + invitations (même que Bureau)
5. **SuperCorrecteur** : Validation ressources (bypass workflow 3 validations)
6. **Correcteur** : Validation ressources (1 validation parmi 3 requises)
7. **Membre** : Utilisateur standard avec accès ressources
8. **En attente** : Nouveau inscrit non validé

### Permissions Granulaires (Exemples)
- `events:create`, `events:update`, `events:delete`
- `resources:create`, `resources:approve`, `resources:publish`
- `members:invite`, `members:update`, `members:ban`
- `roles:create`, `roles:update`, `roles:delete`
- `logs:view`

---

**Dernière mise à jour** : 2025-11-04
**Version** : 0.1.0 (MVP Auth uniquement)
**Prochaine milestone** : Phase 1 - RBAC & Admin (P0)
