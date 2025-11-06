# ADEM - Association Dauphinoise des Étudiants Musulmans

Web-app pour la gestion et les ressources de l'association ADEM.

## 📊 État du Projet

**Score Global : 8.5/10** (85/100)

**Statut** : Auth + RBAC + Gestion Membres/Rôles/Invitations **complètes** + Hiérarchie des rôles implémentée. Prêt pour ressources & dashboard.

| Catégorie | Score | État |
|-----------|-------|------|
| Architecture & Structure | 9/10 | ✅ Excellente organisation App Router |
| Authentification (Better-Auth) | 9/10 | ✅ Complète (Admin plugin custom RBAC) |
| Base de données (Drizzle) | 9/10 | ✅ 11 tables + migrations + seed appliqué |
| Sécurité & RBAC | 9.5/10 | ✅ Guards exhaustifs + audit logging + hiérarchie |
| Gestion Membres | 10/10 | ✅ CRUD complet + tabs + dialogs + hiérarchie |
| Gestion Rôles | 9.5/10 | ✅ CRUD + permissions granulaires |
| Invitations & Whitelist | 9/10 | ✅ Import CSV/XLSX/TXT + batch operations |
| Fonctionnalités Métier | 5/10 | ✅ Auth/RBAC/Membres/Rôles/Invites, ⚠️ Dashboard/Ressources/Événements manquants |
| DevX & Tooling | 7/10 | ✅ Scripts DB + seed, ⚠️ tests absents |
| Emails | 9/10 | ✅ Mock/Resend + templates React Email |

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
- ✅ Better-Auth Admin plugin activé (server + client)

### RBAC (Rôles & Permissions)
- ✅ **Schéma DB complet** : `roles`, `permissions`, `rolePermissions`, `userRoles`, `auditLogs`, `orgUnits`, `whitelist`
- ✅ **Migrations appliquées** : 11 tables créées en DB
- ✅ **Seed initial** : 7 rôles ADEM + 30 permissions granulaires + mappings
- ✅ **Guards exhaustifs** : 16 fonctions (hasRole, can, requireRole, requirePermission + variantes ANY/ALL + hiérarchie) avec cache React
- ✅ **Hiérarchie des rôles** :
  - `getUserMaxPriority(userId)` : Récupère la priorité maximale d'un utilisateur
  - `canManageUser(currentUserId, targetUserId)` : Vérifie hiérarchie (priority strictement supérieure)
  - `requireCanManageUser()` : Guard qui throw erreur si hiérarchie non respectée
  - Protection UI : Actions masquées dans dropdown si `canManage === false`
  - Protection serveur : Toutes server actions vérifient hiérarchie avant action
- ✅ **Helpers** : isAdmin(), isModerator(), isBureauOrCA(), isCorrector()
- ✅ **Sidebar RBAC** : Navigation conditionnelle selon rôle utilisateur
- ✅ **Pages /roles complètes** :
  - Liste rôles avec création
  - Édition détaillée (3 tabs : Général, Permissions, Membres)
  - CRUD complet avec safe delete (réassigne "Membre" si dernier rôle)
  - Permissions groupées par resource style Discord
- ✅ **Server actions** : 10+ actions dans `/server/roles.ts` (485 lignes)

### Paramètres Utilisateur
- ✅ Modification nom
- ✅ Modification email (avec re-vérification)
- ✅ Changement mot de passe (avec regex : maj + min + chiffre)
- ✅ Suppression de compte (avec confirmation AlertDialog)

### Gestion Membres (/members)
- ✅ **Page complète avec 3 tabs** : Actifs (filtrés sans admin) / En attente / Bannis-Expulsés
- ✅ **Search & filters** : Recherche par nom/email en temps réel
- ✅ **Actions membres actifs** : Voir profil, Changer rôle (multi-select), Reset password, Bannir (permanent), Supprimer
- ✅ **Actions membres pending** : Accepter (→ active + rôle Membre), Rejeter (→ suppression)
- ✅ **Actions membres bannis** : Débannir (→ active), Supprimer définitivement
- ✅ **Dialogs confirmation** : 7 dialogs pour toutes actions sensibles (ChangeRole, Ban, ResetPassword, Delete, Reject, ViewProfile)
- ✅ **Server actions** : 9 actions dans `/server/members.ts` (605+ lignes) avec guards + audit logging + hiérarchie
- ✅ **Custom ban/unban** : Implémentation directe en DB (bannissement permanent uniquement)
- ✅ **Protection UI** : Ellipsis masqué pour l'utilisateur courant
- ✅ **Système de hiérarchie complet** :
  - Actions conditionnées par hiérarchie (Bureau ne peut pas gérer Moderateur)
  - Vérification au chargement via `canManageUserAction()` pour chaque membre
  - Dropdown affiche "Aucune action disponible" si hiérarchie non respectée
  - Protection double couche (UI + serveur)

### Invitations & Whitelist (/invitations)
- ✅ **Liste whitelist** : Affichage tous emails avec actions delete individual + clear all
- ✅ **Import fichiers** : Upload CSV/XLSX/TXT avec parser robuste
- ✅ **Preview avant import** : Validation emails + affichage valides/invalides
- ✅ **Ajout manuel** : Dialog pour ajouter 1 email
- ✅ **Batch operations** : Import multiple + delete + clear
- ✅ **Server actions** : 5 actions dans `/server/invitations.ts` (245 lignes)
- ✅ **Parser intelligent** : 3 formats supportés avec détection automatique (lib/parsers.ts - 188 lignes)

### Sécurité
- ✅ Middleware de protection routes (redirect si non connecté)
- ✅ Blocage si email non vérifié
- ✅ Redirection users status='pending' vers `/pending` (page d'attente)
- ✅ Data Access Layer (`verifySession()`) pour server actions
- ✅ DTO (`sanitizeUser()`) pour exposer uniquement données publiques
- ✅ Cascade delete (sessions/accounts supprimés avec l'utilisateur)
- ✅ **Policy layer RBAC complet** : lib/rbac.ts (430+ lignes) avec 16 fonctions + cache
- ✅ **Système de hiérarchie** : Basé sur field `priority` des rôles (Admin=100, Modo=80, Bureau/CA=70, etc.)
  - getUserMaxPriority() : Récupère priorité max user
  - canManageUser() : Vérifie si currentUser peut gérer targetUser (priority strictement >)
  - requireCanManageUser() : Guard qui throw si hiérarchie non respectée
- ✅ **Middleware protection par rôle** : Routes `/roles/**`, `/members/**`, `/invitations/**` protégées
- ✅ **Audit logging actif** : lib/audit.ts (89 lignes) - Toutes actions sensibles loggées (ban, unban, delete, setRoles, accept, reject, rolePermissions)
- ✅ **Guards dans toutes server actions** : requireAnyRole() + requireCanManageUser() systématiques
- ✅ **Better-Auth Admin custom** : impersonatedBy() autorise Admin/Modérateur/Bureau/CA pour actions admin

### UI/UX
- ✅ Sidebar responsive avec navigation organisée par sections RBAC
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

## ❌ Ce qui Manque

### Critique (P0 - Immédiat)
1. **(En cours) Utiliser les fonctions requirePermission(user.id,permission) et requireAllPermissions(id,permissions[]) pour permettre les actions** : Refactoriser toutes les pages et les composants pour s'assurer de la sécurité et de la gestion des rôles et permissions et voir si TOUTES les actions sont logges dans audit_log !
2. **❌ Ajout membre unique (/add)** : Création + envoi OTP + force reset on first login
3. **?? Rate limiting server actions** : Implémenter `@upstash/ratelimit` sur actions sensibles (ban, delete, setRoles)


### Important (P1 - Pages Métier)
4. **❌ Cours** : Hiérarchie Année → Filière → Matière + éditeur Tiptap + workflow validation (3 Correctors, bypass SuperCorrector)
5. **❌ Exercices** : Par TD/matière/filière avec indices & corrections
6. **❌ Annales** : Mode simulation examen avec minuteur + indices/corrections

### Fonctionnalités Avancées (P2 - Ressources)
7. **❌ Dashboard (/)** : Citation du jour, 4 KPIs, événements à venir, tâches récentes, quick actions
8. **❌ Calendrier** : CRUD événements (Admin/Bureau/CA) + inscriptions membres
9. **❌ Tâches** : Kanban personnel (To Do / In Progress / Done) + chart progression
10. **❌ Feedback** : Formulaire de retour utilisateurs (titre, description, type)

### DevX & Qualité (P3)
11. **❌ Tests** : RBAC guards, parsers CSV/XLSX/TXT
12. **❌ Documentation JSDoc** : Fonctions complexes
13. **❌ Avatar upload** : Implémentation complète (field exists dans DB)
14. **❌ Notifications email** : Système de notifications asynchrones

---

## 🚀 Prochaines Étapes (Ordre Recommandé)

### ✅ Phase 1 : RBAC & Admin DB (COMPLÉTÉE)
**Objectif** : Débloquer la gestion des utilisateurs et permissions

1. ✅ **Migrations Drizzle RBAC** : Tables créées (roles, permissions, rolePermissions, userRoles, auditLogs, orgUnits)
2. ✅ **Seed initial RBAC** : 7 rôles ADEM + 30 permissions granulaires appliqués
3. ✅ **Better-Auth Admin Plugin** : Activé (server + client) + colonnes ajoutées
4. ✅ **Policy Layer & Guards** : `hasRole()`, `can()`, `requireRole()`, `requirePermission()` implémentés (lib/rbac.ts)
5. ✅ **Utilisateur Admin créé** : Prêt pour tests

**Statut** : ✅ Fondations RBAC complètes

---

### ✅ Phase 2 : Pages Admin & Protection (Priorité P0 - EN COURS)
**Objectif** : Exploiter l'infrastructure RBAC avec les pages de gestion

**Durée estimée** : 3-4 jours

1. ✅ **Middleware protection par rôle (½ jour)**
   ```typescript
   // proxy.ts : Ajouter checks RBAC
   if (pathname.startsWith('/admin/')) {
       const userIsAdmin = await isAdmin(session.user.id);
       if (!userIsAdmin) return NextResponse.redirect('/');
   }
   if (pathname.startsWith('/bureau/')) {
       const hasAccess = await isBureauOrCA(session.user.id);
       if (!hasAccess) return NextResponse.redirect('/');
   }
   ```

2. ✅ **Audit logging helper (½ jour)**
   - Créer `lib/audit.ts` avec fonction `logAudit(userId, action, resource, metadata)`
   - Intégrer dans toutes les server actions sensibles

3. ✅ **Page /members (1.5 jours)**
   - Séparer les membres en trois tabs : Une pour les membres avec le status 'active', une pour le status 'pending' et un autre tab pour les autres ('banned','suspended')
   - Pour chaque Membre une Card shadcn/ui responsive avec pagination/filters/sort en haut 
   - Ce qu'il y aura dans la Card : avatar, nom, email, rôles, statut, date inscription
   - Actions inline pour le tab 'Membres actifs' (à droite il y aura un bouton avec une icone Ellipsis de lucide react et avec ça un popover qui indiquera toute les actions suivantes) :
     - Voir le profil
     - Changer rôle (Dialog avec Select multi-rôles)
     - Reset password (envoie email reset)
     - Expulser (avec raison obligatoire + durée optionnelle)
     - Bannir (avec raison obligatoire)
     - Supprimer
   - Actions inline pour le tab 'Membres en attente' :
     - Accepter le membre
     - Refuser le membre
   - Actions inline pour le tab 'Membres bannis/expulsés' :
     - Deban le membre (uniquement pour les utilisateurs expulsés, les utilisateurs bannis le seront toujours)
   - Server actions : `server/members.ts`
     - `listUsers(filters, pagination)` → pagination Drizzle
     - `setUserRoles(userId, roleIds[])` → avec `logAudit()`
     - `banUser(userId, reason, expiresAt)` → utilise `auth.api.admin.banUser()`
     - `unbanUser(userId)` → utilise `auth.api.admin.unbanUser()`

4. ✅ **Page /roles (1 jour)**
   - Rôles (cards colorées style Discord avec priority) avec tabs
   - CRUD rôles : Dialog create/edit avec nom + priority + color picker
   - Checkboxes permissions groupées par resource (events, resources, members, etc.)
   - Server actions : `server/roles.ts`
     - `createRole(name, priority, color, permissionIds[])`
     - `updateRole(roleId, data, permissionIds[])`
     - `deleteRole(roleId)` → vérifier aucun user n'a ce rôle

5. ✅ **Script admin:promote (¼ jour)**
   - Créer `scripts/promote-admin.ts` pour usage futur
   - Ajouter script `"admin:promote": "tsx scripts/promote-admin.ts"` dans package.json

**Délivrables** : Gestion membres + rôles fonctionnelle avec protection middleware

---

### Phase 3 : Invitations & Whitelist (Bureau/CA)
**Objectif** : Permettre l'onboarding massif des membres et le status 'active' et le rôle 'Membre' directement si l'email est dans la white-liste, sinon mettre en 'pending' et attendre la validation.

**Durée estimée** : 2-3 jours

1. ✅ **Parser CSV/XLSX/TXT (1 jour)**
   - Créer `lib/parsers.ts` avec helpers pour CSV (papaparse), XLSX (xlsx), TXT
   - Upload → parsing → validation email + rôle + statut
   - Preview avec DataTable (erreurs en rouge, warnings en orange)
   - Colonnes fichier : email, role (optionnel), status (optionnel)

2. ✅ **Page /invitations (1 jour)**
   - Upload zone (drag & drop ou file input)
   - Preview DataTable avec filtres (valides/erreurs)
   - Actions : "Tout importer" (transaction) ou "Importer sélection"
   - Server action : `server/invitations.ts`
     - `importBatch(rows[])` → transaction Drizzle + audit logs
     - Auto-assign role "Membre" + status "active" si pas précisé

3. **Page /add (½ jour)**
   - Form : email, nom, rôle (Select), statut (Select)
   - Génère mot de passe temporaire
   - Envoie email avec lien reset password
   - Flag `forcePasswordReset: true` (à implémenter dans schema user)
   - Server action : `server/invitations.ts`
     - `createMember(data)` → utilise `auth.api.admin.createUser()`

**Délivrables** : Import CSV/XLSX + création membre unique fonctionnels

---

### Phase 4 : Ressources (Cours, Exercices, Annales)
**Objectif** : MVP éditeur + workflow validation

**A voir avec un pdf**

**Durée estimée** : 5-7 jours

1. **Tables DB (1 jour)**
   - `courses` (titre, année, filière, matière via orgUnits FK)
   - `chapters` (titre, contenu JSON Tiptap, courseId FK)
   - `exercises` (enoncé, indices, correction, matière FK)
   - `exams` (titre, durée, matière FK, questions[])
   - `validations` (chapterId, validatorId, status, commentaire)

2. **Éditeur Tiptap (2-3 jours)**
   - Installer Tiptap + extensions (StarterKit, CodeBlock, Typography, Placeholder)
   - Créer composant `<TiptapEditor />` réutilisable
   - Extensions custom : annotations (commentaires inline), footnotes
   - Save manuel + auto-save toutes les 30s (debounced)
   - Preview mode vs Edit mode

3. **Workflow Validation (2 jours)**
   - Statut chapter : "draft", "pending", "published"
   - 3 validations Corrector requises → auto-publish
   - SuperCorrector peut bypass (publish directement)
   - Page `/resources/validate` : Liste chapters pending avec bouton "Valider/Rejeter"
   - Notifications email (optionnel) aux auteurs

**Délivrables** : Système de cours/exercices avec validation collaborative

---

### Phase 5 : Dashboard & Quick Wins
**Objectif** : Page d'accueil fonctionnelle + retours utilisateurs

**Durée estimée** : 2-3 jours

1. **Dashboard (/)**
   - Citation du jour (hardcodée ou API gratuite type quotable.io)
   - 4 KPI cards avec icônes :
     - Total membres actifs (count users où status = "active")
     - Événements à venir (count events où date > now)
     - Ressources publiées (count resources où published = true)
     - Tâches complétées aujourd'hui (count tasks où status = "done" et updatedAt = today)
   - Section "Prochains événements" (3 cards avec date + bouton "S'inscrire")
   - Section "Tâches récentes" (3 dernières tâches)
   - Quick actions : boutons vers pages principales

2. **Page Feedback (/feedback)**
   - Form simple : titre (Input), description (Textarea), type (Select : Bug, Suggestion, Autre)
   - Server action : `server/feedback.ts` → stockage DB table `feedback`
   - Toast confirmation "Merci pour votre retour !"

**Délivrables** : Dashboard informatif + système de feedback

---

### Phase 6 : Calendrier & Tâches
**Objectif** : Gestion événements + kanban personnel

**Durée estimée** : 3-4 jours

1. **Calendrier (/calendar)**
   - CRUD événements (Admin/Bureau/CA only via guards)
   - Affichage calendrier (lib react-big-calendar ou fullcalendar)
   - Inscriptions membres (table `eventRegistrations`)
   - Notifications email avant événement (optionnel)

2. **Tâches (/tasks)**
   - Kanban 3 colonnes (To Do / In Progress / Done)
   - Drag & drop (dnd-kit)
   - Chart progression (Recharts : % tâches complétées)
   - CRUD tâches : titre, description, priorité, deadline

**Délivrables** : Calendrier événements + kanban personnel fonctionnels

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
│   ├── font.ts                # Toutes les fonts Google ✅
│   ├── rbac.ts                # Le système de gestion de rôle RBAC ✅
│   ├── audit.ts               # Pour les logs ✅
│   └── utils.ts               # Utilitaires (cn) ✅
│
├── server/
│   └── settings.ts            # deleteAccount server action ✅
│
├── emails/                    # Templates React Email ✅
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

### 5. ✅ Générer et appliquer les migrations
```bash
pnpm db:generate   # Générer migrations depuis schema.ts
pnpm db:migrate    # Appliquer migrations en DB
```

### 6. Lancer le serveur de développement
```bash
pnpm dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

---

## 📜 Scripts Disponibles

### Développement
```bash
pnpm dev          # Serveur de développement Next.js
pnpm build        # Build production
pnpm start        # Serveur production
pnpm lint         # ESLint
```

### Base de données (Drizzle)
```bash
pnpm db:generate              # Générer migrations depuis schema.ts
pnpm db:migrate               # Appliquer migrations en DB
pnpm db:push                  # Push schema sans migration (dev rapide)
pnpm db:studio                # Drizzle Studio (GUI DB sur port 4983)
```
---

## 🔐 Sécurité

### Implémentée
- ✅ Middleware de protection routes (redirect si non connecté)
- ✅ Vérification email obligatoire
- ✅ Rate limiting (5 req/60s sur endpoints auth)
- ✅ Cascade delete (sessions/accounts)
- ✅ Server-side session checks (`verifySession()`)
- ✅ DTO pour sanitize données utilisateur
- ✅ Password hashing (Better-Auth bcrypt)
- ✅ Regex password fort (maj + min + chiffre)
- ✅ Guards RBAC exhaustifs (`hasRole()`, `can()`, `requireRole()`, `requirePermission()`)
- ✅ CSRF tokens (géré nativement par Better-Auth)
- ✅ Routes `/roles/**` protégées par middleware RBAC
- ✅ Table `auditLogs` créée et fonction `logAudit()` implémentée
- ✅ **Better-Auth Admin plugin configuré** : `impersonatedBy()` autorise Admin et Modérateur pour les actions ban/unban
- ✅ **Guards dans server actions** : Toutes les actions membres utilisent `requireAnyRole()`
- ✅ **Audit logging actif** : Toutes les actions sensibles (ban, unban, delete, setRoles, accept, reject) loggées avec métadonnées)

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

### Permissions Granulaires (Exemples)
- `events:create`, `events:update`, `events:delete`, `events:read`
- `resources:create`, `resources:approve`, `resources:publish` ...
- `members:invite`, `members:update`, `members:ban` ...
- `roles:create`, `roles:update`, `roles:delete` ...
- `logs:view` ...
(Voir la table 'permission' pour ça)

---

---

## 📋 Résumé Exécutif

### Ce qui fonctionne maintenant (v0.6.0)
✅ **Authentification complète** : Sign up/in, email verification, reset password, change email, rate limiting
✅ **RBAC complet** : 7 rôles ADEM + 30 permissions + 16 guards exhaustifs (430+ lignes) avec cache React
✅ **Hiérarchie des rôles** : Système complet basé sur priority (Admin=100, Modo=80, Bureau/CA=70...)
   - getUserMaxPriority() : Récupère priorité max
   - canManageUser() : Vérifie hiérarchie (priority >)
   - requireCanManageUser() : Guard serveur
   - canManageUserAction() : Exposition côté client
   - Protection UI : Actions masquées si canManage === false
   - Protection serveur : Toutes server actions vérifient hiérarchie
✅ **DB prête** : 11 tables + migrations + seed appliqué (7 rôles + 30 permissions + mappings)
✅ **Sécurité avancée** :
   - Middleware RBAC sur routes `/roles/**`, `/members/**`, `/invitations/**`
   - Better-Auth Admin custom (impersonatedBy autorise Admin/Modo/Bureau/CA)
   - Audit logging actif sur toutes actions sensibles (89 lignes)
   - Guards RBAC dans toutes server actions (requireAnyRole + requireCanManageUser)
   - Custom ban/unban (permanent, direct DB, pas Better-Auth)
   - Système de hiérarchie : Bureau ne peut pas bannir/supprimer Moderateur
✅ **Pages complètes** :
   - ✅ `/roles` : Liste + création + édition (3 tabs : Général/Permissions/Membres) + safe delete
   - ✅ `/members` : 3 tabs (actifs/pending/bannis) + search + 7 dialogs + toutes actions + hiérarchie
   - ✅ `/invitations` : Whitelist + import CSV/XLSX/TXT + preview + batch operations
   - ✅ `/pending` : Page d'attente pour users status='pending'
   - ✅ `/settings` : Profile + Account + Security
✅ **Server actions** : 26+ actions (1650+ lignes) avec guards + audit logging + hiérarchie
✅ **Components** : 40+ composants (auth, settings, members, roles, invitations, ui)
✅ **Parsers** : CSV/XLSX/TXT (188 lignes) avec validation email robuste

### Statistiques du code
- **Total lignes** : ~4700+ (sans node_modules)
- **Fichiers TS/TSX** : 87+
- **Tables DB** : 11
- **Server actions** : 26+ (members: 9, roles: 10, invitations: 5, settings: 1, auth: 1)
- **Composants React** : 40+
- **Dialogs** : 9 (ChangeRole, Ban, ResetPassword, Delete, Reject, ViewProfile, ImportFile, AddEmail, CreateRole)
- **Guards RBAC** : 16 fonctions (lib/rbac.ts - 430+ lignes)

### Ce qui manque (prioritaire)
❌ **P0** : Refactorisation et Validation du code, Ajout membre unique dans /add avec toutes les fonctionnalités
❌ **P1** : Cours/Exercices/Annales (éditeur Tiptap + workflow validation)

### Prochaine étape : Dashboard + Quick Wins (1-2 jours)
🎯 Créer dashboard avec citation + KPIs + script admin:promote

---

**Dernière mise à jour** : 2025-11-06
**Version** : 0.6.1 (Auth + RBAC + Membres + Rôles + Invitations + **Hiérarchie complète** + Refactorisation et Validation (En cours))
**Prochaine milestone** : Refactorisation et Validation du code, Ajout membre unique dans /add avec toutes les fonctionnalités + Cours/Exercices/Annales (éditeur Tiptap + workflow validation)
