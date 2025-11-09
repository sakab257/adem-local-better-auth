# ADEM - Association Dauphinoise des Étudiants Musulmans

Web-app pour la gestion et les ressources de l'association ADEM.

## 📊 État du Projet

**Score Global : 7.2/10** (72/100)

**Statut** : Auth + RBAC + Gestion Membres/Rôles/Invitations **complètes** + Hiérarchie des rôles + **Gestion d'erreurs refactorisée**. Architecture solide mais nécessite refactoring (composants volumineux, code dupliqué).

| Catégorie | Score | État |
|-----------|-------|------|
| **Nomenclature** | 7/10 | ⚠️ Bonne globalement, violations (dal.ts, dto.ts) |
| **Pattern ActionResponse/DataResponse** | 9/10 | ✅ Excellent, petit usage `can()` au lieu de `requirePermission()` |
| **Sécurité RBAC** | 9/10 | ✅ Système complet, manque rate limiting |
| **Gestion d'erreurs** | 8/10 | ✅ Try/catch partout, gestion tout-ou-rien dans pages |
| **Organisation code** | 7/10 | ⚠️ Modulaire, composants trop volumineux (472 lignes) |
| **Réutilisabilité** | 6/10 | ⚠️ Code dupliqué, hooks manquants |
| **Performance** | 7/10 | ✅ Cache utilisé, ⚠️ pas de pagination, fetch dans useEffect |
| **Testabilité** | 3/10 | ❌ Aucun test unitaire | (pas prioriataire, j'effectue les tests moi-meme)
| **Accessibilité** | 5/10 | ⚠️ Base shadcn bonne, ARIA insuffisant | (ARIA à implémenter plus tard voir jamais...)
| **Documentation** | 6/10 | ⚠️ Commentaires présents, JSDoc manquant | (le README et les commentaires seront suffisants pour la doc)

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
- ✅ **Guards exhaustifs** : 16 fonctions (`hasRole`, `can`, `requireRole`, `requirePermission` + variantes ANY/ALL + hiérarchie) avec cache React
- ✅ **Hiérarchie des rôles** :
  - `getUserMaxPriority(userId)` : Récupère la priorité maximale d'un utilisateur
  - `canManageUser(currentUserId, targetUserId)` : Vérifie hiérarchie (priority strictement supérieure)
  - `requireCanManageUser()` : Guard qui throw erreur si hiérarchie non respectée
  - `getManageableRoles()` : Retourne tous les rôles assignables par l'utilisateur courant
  - Protection UI : Actions masquées dans dropdown si `canManage === false`
  - Protection serveur : Toutes server actions vérifient hiérarchie avant action
- ✅ **Helpers** : `isAdmin()`, `isModerator()`, `isBureauOrCA()`, `isCorrector()`
- ✅ **Sidebar RBAC** : Navigation conditionnelle selon rôle utilisateur
- ✅ **Pages /roles complètes** :
  - Liste rôles avec création
  - Édition détaillée (3 tabs : Général, Permissions, Membres)
  - CRUD complet avec safe delete (réassigne "Membre" si dernier rôle)
  - Permissions groupées par resource style Discord
- ✅ **Server actions** : 10+ actions dans `/server/roles.ts` (485 lignes)

### Gestion d'Erreurs (Pattern ActionResponse/DataResponse)
- ✅ **Architecture cohérente** :
  - **Fonctions de lecture** : Retournent `DataResponse<T> = { success: boolean; data?: T; error?: string }`
  - **Fonctions d'écriture** : Retournent `ActionResponse = { success: boolean; error?: string }`
  - **Guards** : Utilisent `throw Error` pour bloquer l'exécution (pattern intentionnel)
- ✅ **Fonctions refactorisées** :
  - `getAllRoles()` → `DataResponse<RoleData[]>`
  - `getManageableRoles()` → `DataResponse<RoleData[]>`
  - `getUserById()` → `DataResponse<UserWithRoles>`
  - `listUsers()` → `DataResponse<ListUsersResponse>`
  - `listWhitelistEmails()` → `DataResponse<WhitelistEntry[]>`
- ✅ **UI robuste** : Toutes les pages gèrent `result.success` et affichent des messages d'erreur clairs (composant `<Alert>`)
- ✅ **Pas de throw dangereux** : Aucun `throw Error` non géré dans les server actions publiques
- ✅ **Score de conformité** : 10/10 (100% des fonctions suivent le bon pattern)

### Paramètres Utilisateur
- ✅ Modification nom
- ✅ Modification email (avec re-vérification)
- ✅ Changement mot de passe (avec regex : maj + min + chiffre)
- ✅ Suppression de compte (avec confirmation AlertDialog)

### Gestion Membres (/members)
- ✅ **Page complète avec 3 tabs** : Actifs (filtrés sans admin) / En attente / Bannis-Expulsés
- ✅ **Search & filters** : Recherche par nom/email en temps réel
- ✅ **Actions membres actifs** : Voir profil, Changer rôle (multi-select avec getManageableRoles), Reset password, Bannir (permanent), Supprimer
- ✅ **Actions membres pending** : Accepter (→ active + rôle Membre), Rejeter (→ suppression)
- ✅ **Actions membres bannis** : Débannir (→ active), Supprimer définitivement
- ✅ **Dialogs confirmation** : 7 dialogs pour toutes actions sensibles (ChangeRole, Ban, ResetPassword, Delete, Reject, ViewProfile)
- ✅ **Server actions** : 12 actions dans `/server/members.ts` (750+ lignes) avec guards + audit logging + hiérarchie
- ✅ **Custom ban/unban** : Implémentation directe en DB (bannissement permanent uniquement)
- ✅ **Protection UI** : Ellipsis masqué pour l'utilisateur courant
- ✅ **Système de hiérarchie complet** :
  - Actions conditionnées par hiérarchie (Bureau ne peut pas gérer Moderateur)
  - Vérification au chargement via `canManageUserAction()` pour chaque membre
  - Dropdown affiche "Aucune action disponible" si hiérarchie non respectée
  - Protection double couche (UI + serveur)
- ✅ **Gestion d'erreurs robuste** : Affichage `<Alert>` si erreur de chargement

### Invitations & Whitelist (/invitations)
- ✅ **Liste whitelist** : Affichage tous emails avec actions delete individual + clear all
- ✅ **Import fichiers** : Upload CSV/XLSX/TXT avec parser robuste
- ✅ **Preview avant import** : Validation emails + affichage valides/invalides
- ✅ **Ajout manuel** : Dialog pour ajouter 1 email
- ✅ **Batch operations** : Import multiple + delete + clear
- ✅ **Server actions** : 5 actions dans `/server/invitations.ts` (250 lignes)
- ✅ **Parser intelligent** : 3 formats supportés avec détection automatique (`lib/parsers.ts` - 188 lignes)
- ✅ **Gestion d'erreurs robuste** : Affichage `<Alert>` si erreur de chargement

### Sécurité
- ✅ Middleware de protection routes (redirect si non connecté avec proxy.ts)
- ✅ Blocage si email non vérifié
- ✅ Redirection users status='pending' vers `/pending` (page d'attente)
- ✅ Data Access Layer (`verifySession()`) pour server actions
- ✅ DTO (`sanitizeUser()`) pour exposer uniquement données publiques
- ✅ Cascade delete (sessions/accounts supprimés avec l'utilisateur)
- ✅ **Policy layer RBAC complet** : `lib/rbac.ts` (430+ lignes) avec 16 fonctions + cache
- ✅ **Système de hiérarchie** : Basé sur field `priority` des rôles (Admin=100, Modo=80, Bureau/CA=70, etc.)
- ✅ **Middleware protection par rôle** : Routes `/roles/**`, `/members/**`, `/invitations/**` protégées
- ✅ **Audit logging actif** : `lib/audit.ts` (89 lignes) - Toutes actions sensibles loggées (ban, unban, delete, setRoles, accept, reject, rolePermissions)
- ✅ **Guards dans toutes server actions** : `requirePermission()` + `requireCanManageUser()` systématiques
- ✅ **Better-Auth Admin custom** : `impersonatedBy()` autorise Admin/Modérateur/Bureau/CA pour actions admin
- ✅ **Gestion d'erreurs sécurisée** :
  - Aucun `throw Error` dangereux exposé aux utilisateurs
  - Pattern `DataResponse`/`ActionResponse` pour toutes les server actions
  - Messages d'erreur clairs en français pour l'utilisateur final

### UI/UX
- ✅ Sidebar responsive avec navigation organisée par sections RBAC
- ✅ Header avec SidebarTrigger
- ✅ Dark mode / Light mode (next-themes)
- ✅ Toast notifications (Sonner)
- ✅ Composant `<Alert>` pour afficher les erreurs de manière élégante
- ✅ 20+ composants shadcn/ui installés
- ✅ Layout App Router avec route groups

### Emails
- ✅ Service email avec mode Mock (dev) et Resend (prod)
- ✅ Templates React Email (verification + reset password)
- ✅ Extraction automatique des liens de vérification en mode Mock

---

## ❌ Ce qui Manque & Points d'Amélioration

### 🔴 Violations Critiques (P0 - Immédiat)

1. **❌ Composant `members-grid.tsx` trop volumineux** (472 lignes) → Découper en hooks + sous-composants

### 🟠 Violations Importantes (P1 - Urgent)

2. **❌ Permissions incohérentes** : `getAllRoles()` vs `getUserById()` → Uniformiser (lecture: 1 permission, écriture: multiple)
3. **❌ Pas de transactions DB** dans `deleteRole()` → Ajouter `db.transaction()`
4. **❌ Data fetching dans useEffect** (`change-role-dialog.tsx`) → Passer data en props depuis page serveur
5. **❌ Pagination hardcodée** (limit: 50) → Implémenter pagination avec searchParams

### 🟡 Améliorations Recommandées (P2 - Souhaitable)

6. **❌ Pas de metadata dynamique** → Utiliser `generateMetadata` dans pages `[id]`
7. **❌ Gestion d'erreurs partielle** → Gérer erreurs individuellement par tab au lieu de tout-ou-rien
8. **❌ Code dupliqué** (logique réassignation rôle "Membre") → Extraire dans `/lib/rbac-utils.ts`

### Fonctionnalités Manquantes

16. **❌ Ajout membre unique (/add)** : Création + envoi OTP + force reset on first login
17. **❌ Dashboard** : Citation + KPIs + événements + tâches + quick actions
18. **❌ Cours/Exercices/Annales** : Éditeur Tiptap + workflow validation
19. **❌ Calendrier** : CRUD événements (Admin/Bureau/CA) + inscriptions membres
20. **❌ Feedback** : Formulaire de retour utilisateurs

---

## 🎯 Conventions de Gestion d'Erreurs

### Pattern ActionResponse/DataResponse

Le codebase suit une architecture cohérente pour la gestion d'erreurs :

#### 1. Fonctions de Lecture (Data Fetching)
```typescript
// Retourne DataResponse<T>
export async function listUsers(): Promise<DataResponse<ListUsersResponse>> {
  try {
    const data = await db.query.user.findMany();
    return { success: true, data };
  } catch (error) {
    console.error("Erreur:", error);
    return {
      success: false,
      error: "Impossible de récupérer les utilisateurs. Veuillez réessayer."
    };
  }
}
```

**Usage côté client/page :**
```typescript
const result = await listUsers();
if (!result.success) {
  return <Alert variant="destructive">{result.error}</Alert>;
}
const users = result.data!;
```

#### 2. Fonctions d'Écriture (Mutations)
```typescript
// Retourne ActionResponse
export async function banUser(userId: string): Promise<ActionResponse> {
  try {
    await db.update(user).set({ banned: true }).where(eq(user.id, userId));
    return { success: true };
  } catch (error) {
    console.error("Erreur:", error);
    return { success: false, error: "Impossible de bannir l'utilisateur." };
  }
}
```

**Usage côté client :**
```typescript
const result = await banUser(userId);
if (result.success) {
  toast.success("Utilisateur banni avec succès");
} else {
  toast.error(result.error);
}
```

#### 3. Guards (throw légitime)
```typescript
// Les guards PEUVENT throw des erreurs
export async function requirePermission(userId: string, permission: string): Promise<void> {
  const hasPermission = await can(userId, permission);
  if (!hasPermission) {
    redirect('/'); // ou throw new Error()
  }
}
```

**Quand utiliser throw :**
- ✅ Guards de sécurité (`verifySession`, `requirePermission`, `requireRole`)
- ✅ Erreurs de configuration système (`RESEND_API_KEY` manquante)
- ✅ Erreurs React Context (`useSidebar` hors provider)

**Quand NE PAS utiliser throw :**
- ❌ Server actions appelées depuis le client
- ❌ Fonctions de lecture de données
- ❌ Fonctions d'écriture/mutations

---

## 🚀 Plan d'Action Prioritaire

### 🔴 Phase 1 : Correctifs Critiques (1-2 jours)

**Objectif** : Corriger les violations critiques

1. **Découper `members-grid.tsx`** (472 lignes → ~250 lignes):
   - Créer hooks: `use-members-filter.ts`, `use-members-actions.ts`
   - Créer composants: `member-card.tsx`, `members-search-bar.tsx`
   - Créer dossier: `components/members/dialogs/`

### 🟠 Phase 2 : Refactoring Important (3-5 jours)

**Objectif** : Améliorer la maintenabilité et performance

2. **Uniformiser permissions**:
   - Lecture: 1 permission (`members:read`)
   - Écriture: Multiple permissions (`requireAllPermissions([...])`)

3. **Ajouter transactions DB**:
   ```typescript
   await db.transaction(async (tx) => { ... });
   ```

4. **Extraire logique dupliquée**:
   ```typescript
   // /lib/rbac-utils.ts
   export async function ensureUserHasRole(userId: string, assignedBy: string) { ... }
   ```

### 🟡 Phase 3 : Améliorations & Tests (5-7 jours)

**Objectif** : Solidifier la qualité et l'UX

5. **Passer data en props** au lieu de fetch dans useEffect:
    ```typescript
    // Page serveur
    const rolesResult = await getManageableRoles();
    <ChangeRoleDialog availableRoles={rolesResult.data} />
    ```

6. **Implémenter pagination**:
    - Backend: déjà prêt dans `listUsers`
    - Frontend: composant `<Pagination>` + searchParams

7. **Ajouter error boundaries**:
    - `app/error.tsx`
    - `app/(application)/error.tsx`


### 📝 Phase 4 : Nouvelles Fonctionnalités (Variable)

15. **Page `/add`** : Ajout membre unique (1 jour)
16. **Dashboard `/`** : Citation + KPIs + événements (2-3 jours)
17. **Cours/Exercices/Annales** : Tiptap + validation (5-7 jours)

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

## 📊 Statistiques du Projet

### Code
- **Total lignes** : ~5000+ (sans node_modules)
- **Fichiers TS/TSX** : 90+
- **Tables DB** : 11
- **Server actions** : 32+ (members: 12, roles: 10, invitations: 5, settings: 1, auth: 1)
- **Composants React** : 45+
- **Guards RBAC** : 16 fonctions (`lib/rbac.ts` - 430+ lignes)

### Architecture (Score : 7.2/10)

#### Forces ✅
- ✅ RBAC complet et sophistiqué (hiérarchie, guards, audit)
- ✅ Pattern ActionResponse/DataResponse bien maîtrisé (9/10)
- ✅ Architecture modulaire avec séparation claire des responsabilités
- ✅ Sécurité globalement solide (verifySession, requirePermission)
- ✅ Messages utilisateurs en français

#### Axes d'amélioration ⚠️
- ⚠️ Découper composants volumineux (members-grid.tsx: 472 lignes)
- ⚠️ Uniformiser vérifications permissions

---

## 📖 Documentation Technique

### Better-Auth
- [Docs officielles](https://www.better-auth.com/docs)
- [Plugin Admin](https://www.better-auth.com/docs/plugins/admin)

### Drizzle ORM
- [Docs officielles](https://orm.drizzle.team/docs/overview)
- [PostgreSQL](https://orm.drizzle.team/docs/get-started-postgresql)

### Next.js 16
- [App Router](https://nextjs.org/docs/app)
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)

---

## 📝 Résumé Exécutif

### ✅ Ce qui fonctionne maintenant (v0.7.0)
- **Authentification complète** : Sign up/in, email verification, reset password, change email, rate limiting
- **RBAC complet** : 7 rôles ADEM + 30 permissions + 16 guards exhaustifs (430+ lignes)
- **Hiérarchie des rôles** : Système complet basé sur priority (Admin=100, Modo=80...)
- **Gestion d'erreurs refactorisée** : Pattern ActionResponse/DataResponse cohérent (9/10)
- **DB prête** : 11 tables + migrations + seed appliqué
- **Sécurité avancée** : Audit logging + guards + hiérarchie
- **Pages complètes** : `/roles`, `/members`, `/invitations`, `/settings` avec gestion d'erreurs robuste
- **Server actions** : 32+ actions (1900+ lignes) avec pattern cohérent
- **Components** : 45+ composants avec feedback utilisateur clair

### ⚠️ Points d'attention identifiés

**Architecture solide (7.2/10)** mais nécessite refactoring pour passage en production :
- 🔴 **5 violations critiques** : nomenclature, duplication types, composants volumineux
- 🟠 **5 violations importantes** : rate limiting, transactions DB, pagination
- 🟡 **5 améliorations recommandées** : tests, a11y, documentation

### 🎯 Prochaine étape : Phase 1 - Correctifs Critiques (1-2 jours)

**Objectif** : Corriger les 5 violations critiques avant d'ajouter de nouvelles fonctionnalités

1. Renommer fichiers non-conformes (`dal.ts` → `session.ts`)
2. Fixer duplication `UserWithRoles`
3. Remplacer `can()` par `requirePermission()` dans listUsers
4. Créer `/middleware.ts`
5. Découper `members-grid.tsx`

**Ensuite** : Phase 2 (Refactoring) → Phase 3 (Tests) → Phase 4 (Nouvelles fonctionnalités)

---

**Dernière mise à jour** : 2025-11-07
**Version** : 0.7.0
**Score Architecture** : 7.2/10 (bon, nécessite refactoring)
**Prochaine milestone** : Correctifs critiques (Phase 1) puis Page `/add` + Dashboard
