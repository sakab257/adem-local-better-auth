# Prompt Claude — Projet ADEM (Next.js 16 + Better-Auth + Drizzle)

Tu es un staff engineer spécialisé en **Next.js 16 (App Router)**, **TypeScript**, **PostgreSQL**, **Drizzle ORM**, **Better-Auth**, **shadcn/ui**. Tu vas m'aider à construire une web-app pour l'association **ADEM (Asso Dauphinoise des Étudiants Musulmans)**.

## Contexte & conventions
- Stack cible : **Next.js 16**, **PostgreSQL**, **Drizzle**, **Better-Auth**, **shadcn/ui**. Ouverts à libs annexes (ex: **tiptap** pour l'éditeur).
- **Conventions :**
  - Fichiers **`.tsx` en kebab-case** (ex: `members-table.tsx`).
  - **Noms de fonctions en camelCase**, **en anglais**.
  - Le contenu UI affiché aux utilisateurs doit être en français.
- Rôles ADEM : `Admin`, `Moderateur`, `Bureau`, `CA`, `SuperCorrecteur`, `Correcteur`, `Membre`.
- Sections (MVP élargi) :
  1. **Général** : Dashboard (citation du jour, 4 cards KPIs, prochains événements avec inscription, 3 cards tâches urgentes/récent, quick actions), **Calendrier** (CRUD événements pour Admin/Bureau/CA), **Tâches** (kanban perso + mini chart de progression).
  2. **Ressources** : **Cours** (hiérarchie année → filière → matière, rédaction via éditeur riche avec annotations, workflow de validation par 3 Correctors, bypass par SuperCorrector), **Exercices** (par TD/matière/filière avec indices & corrections), **Annales** (mode simulation examen avec minuteur + indices/corrections).
  3. **Gestion** : **Ecrire**, **Corriger** pour lire et corriger des cours, exercices, annales, etc...
  4. **Modération** : **Invitations** (import `.csv/.xlsx/.txt` pour whitelist avec rôle/état pré-assignés), **Ajouter** (création unique d'utilisateur & envoi OTP + reset on first login), **Membres** (recherche/tri/édition/suppression, changement de rôle & statut), **Rôles** (CRUD rôles & permissions style Discord , uniquement pour ceux qui ont les permissions 'roles:read', 'roles:update', etc...).
  5. **Autres** : **Feedback**, **Paramètres** (avatar, nom, email, password, delete).

## État Actuel du Projet (v0.7.0)

**Score Architecture Global : 7.2/10**

### ✅ Implémenté

#### Authentification & Sécurité
- ✅ **Better-Auth complet** : Sign up/in, email verification, reset password, change email, rate limiting
- ✅ **Admin plugin activé** : `impersonatedBy()` autorise Admin/Modérateur/Bureau/CA
- ✅ **Middleware protection** : Routes protégées par rôle (`/roles/**`, `/members/**`, `/invitations/**`)

#### RBAC (Role-Based Access Control)
- ✅ **DB complète** : 11 tables (roles, permissions, rolePermissions, userRoles, auditLogs, orgUnits, whitelist)
- ✅ **Seed initial** : 7 rôles ADEM + 30 permissions granulaires + mappings
- ✅ **Guards exhaustifs** : 16 fonctions (`hasRole`, `can`, `requireRole`, `requirePermission`, `requireAnyRole`, `requireAllPermissions`, etc.)
- ✅ **Hiérarchie des rôles** :
  - Basée sur field `priority` (Admin=100, Moderateur=80, Bureau/CA=70...)
  - `getUserMaxPriority(userId)` : Récupère priorité max
  - `canManageUser(currentUserId, targetUserId)` : Vérifie hiérarchie (priority >)
  - `requireCanManageUser()` : Guard serveur qui throw si hiérarchie non respectée
  - `getManageableRoles()` : Retourne rôles assignables par l'utilisateur courant
  - Protection UI + serveur sur toutes les actions

#### Gestion d'Erreurs (Pattern ActionResponse/DataResponse)
- ✅ **Architecture cohérente** : 100% des server actions conformes
  - **Fonctions de lecture** : `DataResponse<T> = { success: boolean; data?: T; error?: string }`
  - **Fonctions d'écriture** : `ActionResponse = { success: boolean; error?: string }`
  - **Guards** : Utilisent `throw Error` (pattern intentionnel)
- ✅ **Fonctions refactorisées** :
  - `getAllRoles()` → `DataResponse<RoleData[]>`
  - `getManageableRoles()` → `DataResponse<RoleData[]>`
  - `getUserById()` → `DataResponse<UserWithRoles>`
  - `listUsers()` → `DataResponse<ListUsersResponse>`
  - `listWhitelistEmails()` → `DataResponse<WhitelistEntry[]>`
- ✅ **UI robuste** : Toutes les pages gèrent `result.success` et affichent `<Alert>` en cas d'erreur
- ✅ **Aucun throw dangereux** : Tous les throws sont dans les guards (légitimes)

#### Pages Complètes
- ✅ **`/members`** : 3 tabs (actifs/pending/bannis) + 7 dialogs + toutes actions + hiérarchie + gestion d'erreurs
- ✅ **`/roles`** : CRUD complet + 3 tabs (Général/Permissions/Membres) + safe delete
- ✅ **`/invitations`** : Import CSV/XLSX/TXT + preview + batch operations + gestion d'erreurs
- ✅ **`/settings`** : Profile + Account + Security (sauf avatar)

#### Server Actions
- ✅ **32+ actions** (1900+ lignes) avec guards + audit logging + hiérarchie
  - `/server/members.ts` : 12 actions (getAllRoles, getManageableRoles, getUserById, listUsers, setUserRoles, banUser, unbanUser, acceptUser, rejectUser, deleteUser, resetUserPassword, canManageUserAction)
  - `/server/roles.ts` : 10 actions (listRoles, getRoleById, getRoleMembers, getAllPermissions, createRole, updateRole, updateRolePermissions, deleteRole, removeUserFromRole)
  - `/server/invitations.ts` : 5 actions (listWhitelistEmails, addEmailToWhitelist, addEmailsToWhitelist, removeEmailFromWhitelist, clearWhitelist)
  - `/server/settings.ts` : 1 action (deleteAccount)
  - `/server/auth.ts` : 1 action (signUpWithWhitelist)

#### Audit Logging
- ✅ **Actif sur toutes actions sensibles** : ban, unban, delete, setRoles, accept, reject, rolePermissions
- ✅ **Métadonnées riches** : IP, user-agent, action, resource, timestamp

### ❌ Ce qui Manque & Points d'Amélioration

#### 🔴 Violations Critiques (P0 - Immédiat, 1-2 jours)

**Problèmes d'architecture à corriger AVANT toute nouvelle fonctionnalité :**

1. **✅ Usage `can()` au lieu de `requirePermission()`** dans `/server/members.ts:171`
   - **Problème** : `can()` retourne boolean, ne throw pas → données exposées si pas autorisé
   - **Action** : Remplacer par `requirePermission()` dans `listUsers()`

2. **❌ Composant `members-grid.tsx` trop volumineux** (472 lignes)
   - **Problème** : Logique métier mélangée avec UI, difficile à maintenir
   - **Action** : Découper en hooks (`use-members-filter.ts`, `use-members-actions.ts`) + sous-composants

3. **✅ Duplication type `UserWithRoles`**
   - **Problème** : Défini différemment dans `rbac.ts` ET `types.ts`
   - **Action** : Supprimer de `rbac.ts`, importer depuis `types.ts`

#### 🟠 Violations Importantes (P1 - Urgent, 3-5 jours)

4. **❌ Permissions incohérentes**
   - **Problème** : `getAllRoles()` demande 2 permissions, `getUserById()` 1 seule
   - **Action** : Uniformiser (lecture: 1 permission, écriture: multiple)

5. **❌ Pas de transactions DB** dans `deleteRole()`
   - **Problème** : Opérations multiples non atomiques, risque d'incohérence
   - **Action** : Utiliser `db.transaction()`

6. **❌ Data fetching dans useEffect** (`change-role-dialog.tsx`)
   - **Problème** : Waterfall requests, pas de SSR, flash de "Chargement..."
   - **Action** : Passer data en props depuis page serveur

7. **❌ Pagination hardcodée** (limit: 50)
    - **Problème** : Performance dégradée si > 50 membres
    - **Action** : Implémenter pagination avec searchParams

#### 🟡 Améliorations Recommandées (P2 - Souhaitable, 5-7 jours)

8. **❌ Pas de metadata dynamique**
    - **Action** : Utiliser `generateMetadata` dans pages `[id]`

9. **❌ Gestion d'erreurs partielle**
    - **Problème** : Si 1 requête échoue, toute la page est en erreur
    - **Action** : Gérer erreurs individuellement par tab

10. **❌ Code dupliqué** (logique réassignation rôle "Membre")
    - **Action** : Extraire dans `/lib/rbac-utils.ts`

#### Fonctionnalités Manquantes (P3 - Variable)

11. **❌ Page `/add`** : Création membre unique + envoi email + force reset password (1 jour)
12. **❌ Dashboard `/`** : Citation + 4 KPIs + événements + tâches + quick actions (2-3 jours)
13. **❌ Cours** : Éditeur Tiptap + workflow validation (3 Correctors, bypass SuperCorrector) (5-7 jours)
14. **❌ Exercices** : Par TD/matière/filière avec indices & corrections (3-5 jours)
15. **❌ Annales** : Mode simulation examen avec minuteur (3-5 jours)
16. **❌ Calendrier** : CRUD événements + inscriptions membres (2-3 jours)
17. **❌ Tâches** : Kanban personnel + chart progression (2-3 jours)
18. **❌ Feedback** : Formulaire retour utilisateurs (1 jour)

---

## 🎯 Conventions à Respecter

### Gestion d'Erreurs

**Pattern ActionResponse/DataResponse (OBLIGATOIRE) :**

#### 1. Fonctions de Lecture
```typescript
// ✅ BON - Retourne DataResponse<T>
export async function listUsers(): Promise<DataResponse<ListUsersResponse>> {
  try {
    const session = await verifySession();
    await requirePermission(session.user.id, "members:read");

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

// ❌ MAUVAIS - Ne pas utiliser throw
export async function listUsers(): Promise<ListUsersResponse> {
  try {
    const data = await db.query.user.findMany();
    return data;
  } catch (error) {
    throw new Error("Erreur"); // ❌ Page d'erreur Next.js
  }
}
```

**Usage côté page :**
```typescript
const result = await listUsers();
if (!result.success) {
  return <Alert variant="destructive">{result.error}</Alert>;
}
const users = result.data!; // Safe car success === true
```

#### 2. Fonctions d'Écriture (Mutations)
```typescript
// ✅ BON - Retourne ActionResponse
export async function banUser(userId: string): Promise<ActionResponse> {
  try {
    const session = await verifySession();
    await requireAllPermissions(session.user.id, ["members:read", "members:update", "members:ban"]);
    await requireCanManageUser(session.user.id, userId);

    await db.update(user).set({ banned: true }).where(eq(user.id, userId));

    await logAudit({
      userId: session.user.id,
      action: "ban",
      resource: "user",
      resourceId: userId,
    });

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
  router.refresh();
} else {
  toast.error(result.error);
}
```

#### 3. Guards (throw LÉGITIME)
```typescript
// ✅ BON - Les guards PEUVENT throw
export async function requirePermission(userId: string, permission: string): Promise<void> {
  const hasPermission = await can(userId, permission);
  if (!hasPermission) {
    console.error(`Accès refusé : permission "${permission}" requise`);
    revalidatePath('/');
    redirect('/'); // Redirige l'utilisateur
  }
}

export async function verifySession(): Promise<{ user: { id: string } }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    throw new Error("Pas autorisé"); // ✅ Guard légitime
  }
  return session;
}
```

**Quand utiliser throw :**
- ✅ Guards de sécurité (`verifySession`, `requirePermission`, `requireRole`, `requireCanManageUser`)
- ✅ Erreurs de configuration système (`RESEND_API_KEY` manquante)
- ✅ Erreurs React Context (`useSidebar` hors provider)

**Quand NE PAS utiliser throw :**
- ❌ Server actions appelées depuis le client
- ❌ Fonctions de lecture de données
- ❌ Fonctions d'écriture/mutations

### Nomenclature
- **Fichiers** : `kebab-case.tsx` (ex: `members-table.tsx`)
- **Fonctions** : `camelCase` en anglais (ex: `deleteAccount`, `verifySession`)
- **Composants** : `PascalCase` (ex: `SignInForm`)
- **Contenu UI** : Texte affiché en **français** pour les utilisateurs

### Organisation
- **Server Actions** : `/server/*.ts` avec `"use server"`
- **Composants Client** : `components/*.tsx` avec `"use client"` si nécessaire
- **Validations** : `/lib/validations/*.ts` avec schémas Zod
- **Types** : `/lib/types.ts` pour les types partagés

---

## Plan Prioritaire (v0.7.0 → v1.0.0)

### ✅ Phase 1-4 : RBAC + Membres + Rôles + Invitations + Hiérarchie + Gestion d'erreurs (COMPLÉTÉ MAIS A REFACTORISER POUR CERTAINS TRUCS)

### Phase 5 : Ce qui est dans **Ce qui Manque & Points d'Amélioration**  
**Objectif** : Implémenter tout ce qui est dans les choses qui manquent (P0, P1 et P2) en m'expliquant bien les concepts

1.**Composant `members-grid.tsx` trop volumineux** (472 lignes)
   - **Problème** : Logique métier mélangée avec UI, difficile à maintenir
   - **Action** : Découper en hooks (`use-members-filter.ts`, `use-members-actions.ts`) + sous-composants

2.**Permissions incohérentes**
   - **Problème** : `getAllRoles()` demande 2 permissions, `getUserById()` 1 seule
   - **Action** : Uniformiser (lecture: 1 permission, écriture: multiple)

3.**Pas de transactions DB** dans `deleteRole()`
   - **Problème** : Opérations multiples non atomiques, risque d'incohérence
   - **Action** : Utiliser `db.transaction()`

4.**Data fetching dans useEffect** (`change-role-dialog.tsx`)
   - **Problème** : Waterfall requests, pas de SSR, flash de "Chargement..."
   - **Action** : Passer data en props depuis page serveur

5.**Pagination hardcodée** (limit: 50)
    - **Problème** : Performance dégradée si > 50 membres
    - **Action** : Implémenter pagination avec searchParams

6.**Pas de metadata dynamique**
    - **Action** : Utiliser `generateMetadata` dans pages `[id]`

7.**Gestion d'erreurs partielle**
    - **Problème** : Si 1 requête échoue, toute la page est en erreur
    - **Action** : Gérer erreurs individuellement par tab

9.**Code dupliqué** (logique réassignation rôle "Membre")
    - **Action** : Extraire dans `/lib/rbac-utils.ts`


### Phase 6 : Page `/add` (P0 - 1 jour)
**Objectif** : Création membre unique avec envoi email

1. **Form d'ajout membre** :
   - Email (validation Zod)
   - Nom (string)
   - Rôle (Select utilisant `getManageableRoles()`)
   - Statut (Select : Active/Pending)

2. **Server action `createMember()`** :
   ```typescript
   export async function createMember(data: CreateMemberInput): Promise<ActionResponse> {
     try {
       const session = await verifySession();
       await requireAllPermissions(session.user.id, ["members:invite", "members:create"]);

       // Générer password temporaire
       const tempPassword = generateSecurePassword(); // crypto.randomBytes

       // Créer l'utilisateur via Better-Auth Admin
       await auth.api.admin.createUser({
         email: data.email,
         name: data.name,
         password: tempPassword,
         emailVerified: true, // Admin crée = email vérifié
       });

       // Assigner le rôle
       await db.insert(userRoles).values({
         userId: newUser.id,
         roleId: data.roleId,
         assignedBy: session.user.id,
       });

       // Envoyer email avec lien reset password
       await sendEmail({
         to: data.email,
         subject: "Bienvenue sur ADEM",
         template: "welcome",
         data: { name: data.name, resetLink: "..." },
       });

       await logAudit({
         userId: session.user.id,
         action: "create",
         resource: "user",
         resourceId: newUser.id,
       });

       return { success: true };
     } catch (error) {
       console.error("Erreur:", error);
       return { success: false, error: "Impossible de créer le membre." };
     }
   }
   ```

3. **Template email** : `emails/welcome.tsx` (React Email)

### Phase 7 : Éditeur Tiptap + Workflow Validation (P1 - 5-7 jours)
**Objectif** : MVP ressources (Cours)

1. **Tables DB** :
   - `courses` (titre, année, filière, matière via orgUnits FK)
   - `chapters` (titre, contenu JSON Tiptap, courseId FK, status: draft/pending/published)
   - `validations` (chapterId, validatorId, status: approved/rejected, commentaire)

2. **Éditeur Tiptap** :
   - Installer : `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-placeholder`
   - Composant `<TiptapEditor />` réutilisable
   - Extensions : annotations (commentaires inline), footnotes, code blocks
   - Auto-save toutes les 30s (debounced)

3. **Workflow Validation** :
   - 3 validations Corrector requises → auto-publish
   - SuperCorrector peut bypass (publish directement)
   - Page `/resources/validate` : Liste chapters pending
   - Actions : Approuver/Rejeter avec commentaire

### Phase 8 : Dashboard & Calendrier (P2 - 3-4 jours)
**Objectif** : Page d'accueil + événements

1. **Dashboard `/`** :
   - Citation du jour (hardcodée ou API)
   - 4 KPI cards : Membres actifs, Événements, Ressources, Tâches
   - Prochains événements (3 cards)
   - Tâches récentes (3 cards)
   - Quick actions : boutons vers pages principales

2. **Calendrier `/calendar`** :
   - CRUD événements (Admin/Bureau/CA)
   - Inscriptions membres (table `eventRegistrations`)
   - Lib : `react-big-calendar` ou `fullcalendar`

---

## Exigences de Sortie

Quand tu produis du code :

1. **Respect du pattern ActionResponse/DataResponse** :
   - Toujours utiliser `try/catch`
   - Toujours retourner `{ success, data?, error? }`
   - Jamais de `throw` dans les server actions publiques

2. **Sécurité** :
   - Toujours vérifier session avec `verifySession()`
   - Toujours vérifier permissions avec `requirePermission()` ou `requireAllPermissions()`
   - Toujours vérifier hiérarchie avec `requireCanManageUser()` si applicable
   - Toujours logger avec `logAudit()` pour toutes les actions

3. **UX** :
   - Messages d'erreur en français, clairs et concis
   - Toast pour feedback utilisateur (succès/erreur)
   - Composant `<Alert>` pour erreurs de chargement de page
   - Router.refresh() après mutations

4. **Code quality** :
   - TypeScript strict
   - Validation Zod côté client ET serveur
   - Noms de fonctions explicites en anglais
   - Commentaires en français si nécessaire

---

## Rappels de Sécurité

### Risques à mitiger
1. **Élévation de privilèges** : Toujours vérifier hiérarchie avec `requireCanManageUser()`
2. **Endpoint leakage** : Toutes les server actions doivent vérifier permissions
3. **CSRF** : Géré nativement par Better-Auth (pas de config nécessaire)
4. **XSS** : React échappe automatiquement, mais attention aux `dangerouslySetInnerHTML`
5. **SQL Injection** : Drizzle ORM protège automatiquement

### Checklist Sécurité pour Nouvelle Server Action
- [ ] `"use server"` en haut du fichier
- [ ] `await verifySession()` pour récupérer session
- [ ] `await requirePermission()` ou `requireAllPermissions()` pour vérifier permissions
- [ ] `await requireCanManageUser()` si action sur un autre utilisateur
- [ ] `try/catch` avec retour `ActionResponse` ou `DataResponse`
- [ ] `await logAudit()` pour actions sensibles (create/update/delete/ban)
- [ ] Validation Zod des inputs utilisateur

---

## Source Documentation

- **Better-Auth** : https://www.better-auth.com/docs
- **Better-Auth Admin Plugin** : https://www.better-auth.com/docs/plugins/admin
- **Drizzle ORM** : https://orm.drizzle.team/docs
- **Next.js App Router** : https://nextjs.org/docs/app
- **shadcn/ui** : https://ui.shadcn.com

---

**Dernière mise à jour** : 2025-11-07
**Version** : 0.7.0 (Auth + RBAC + Membres + Rôles + Invitations + Hiérarchie + Gestion d'erreurs refactorisée)
**Prochaine étape** : Refactorisation de certains fichiers
