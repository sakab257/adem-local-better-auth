# Prompt Claude — Projet ADEM (Next.js 16 + Better-Auth + Drizzle)

Tu es un staff engineer spécialisé en **Next.js 16 (App Router)**, **TypeScript**, **PostgreSQL**, **Drizzle ORM**, **Better-Auth**, **shadcn/ui**. Tu vas m’aider à construire une web-app pour l’association **ADEM (Asso Dauphinoise des Étudiants Musulmans)**.

## Contexte & conventions
- Stack cible : **Next.js 16**, **PostgreSQL**, **Drizzle**, **Better-Auth**, **shadcn/ui**. Ouverts à libs annexes (ex: **tiptap** pour l’éditeur).
- **Conventions :**
  - Fichiers **`.tsx` en kebab-case** (ex: `members-table.tsx`).
  - **Noms de fonctions en camelCase**, **en anglais**.
  - Le contenu UI affiché aux utilisateurs doit en français.
- Rôles ADEM : `Admin`, `Moderateur`, `Bureau`, `CA`, `SuperCorrecteur`, `Correcteur`, `Membre`, `En attente`.
- Sections (MVP élargi) :
  1. **Général** : Dashboard (citation du jour, 4 cards KPIs, prochains événements avec inscription, 3 cards tâches urgentes/récent, quick actions), **Calendrier** (CRUD événements pour Admin/Bureau/CA), **Tâches** (kanban perso + mini chart de progression).
  2. **Ressources** : **Cours** (hiérarchie année → filière → matière, rédaction via éditeur riche avec annotations, workflow de validation par 3 Correctors, bypass par SuperCorrector), **Exercices** (par TD/matière/filière avec indices & corrections), **Annales** (mode simulation examen avec minuteur + indices/corrections).
  3. **Bureau/CA** : **Invitations** (import `.csv/.xlsx/.txt` pour whitelist avec rôle/état pré-assignés), **Ajouter** (création unique d’utilisateur & envoi OTP + reset on first login).
  4. **Administration** : **Membres** (recherche/tri/édition/suppression, changement de rôle & statut), **Rôles** (CRUD rôles & permissions style Discord).
  5. **Autres** : **Feedback**, **Paramètres** (avatar, nom, email, password, delete) (déjà implémenté sauf l'avatar).

## Ce que je veux que tu produises en priorité
0) **Analyse** :
   - **Analyser mon code actuel** : Tu analyseras mon code actuel et me donneras un score global en t'aidant des docs de better-auth et de drizzle pour avoir les bonnes pratiques, pour ne pas réecrire du code déjà implémenté par ces librairies.
   - **Me dire ce qu'il manque et les prochaines étapes à faire** : Tu me diras ce qu'il manque et les prochaines étapes à implémenter par rapport au code actuel.
   - **Tout résumer dans le README.md** : Tu me feras un gros résumé, concis, pour dire ce qui est implémenté, les fonctionnalitées et les prochaines étapes à faire. Tu seras concis, je ne veux pas un README de 700+ lignes.

1) **RBAC first** (fondations sécurité + DX) :
   - **Schéma Drizzle** : tables `roles`, `permissions`, `rolePermissions`, `userRoles`, `userStatus` (enum), `auditLogs`. Prévois `orgUnits` pour Année/Filière/Matière (hiérarchie) dès maintenant pour éviter les migrations cassantes plus tard.  
   - **Seed** initial des rôles ADEM et des permissions granulaires (ex: `events:create`, `resources:approve`, `members:invite`, etc.).  
   - **Policy layer** : utilitaires `hasRole(user, ...)` et `can(user, 'permission')` + guards côté **server actions/route handlers** et **useAction** côté client.  
   - **Middleware/Proxy** Next (server) pour protéger `/admin/**` et `/bureau/**`.  
   - **Audit logging** minimal (qui a fait quoi, quand, sur quel objet).

2) **Intégration Better-Auth (plugin Admin)** :
   - Active `admin()` côté server et `adminClient()` côté client, puis expose des **use-cases** via services : create user, list users (pagination/filters), set role, update user, set user password, ban/unban, impersonate (si dispo).  
   - Monte une **page Admin → Membres** exploitant ces endpoints (table filtrable/triable paginée, actions en ligne, modals de changement de rôle & reset password).  
   - **Page Admin → Rôles** : CRUD des rôles/permissions (UI type Discord), mapping visuel des permissions.

3) **Invitations Bureau/CA** :
   - Upload parseur (`csv/xlsx/txt`) → validation → prévisualisation → commit en batch.  
   - À l’inscription, matching email → assigner `Member` + `Active` + email verified si whitelist.

4) **Éditeur & ressources (skeleton)** :
   - Choisis **tiptap** (extensible, annotations, code blocks, footnotes).  
   - Crée les types et routes, mais garde l’UI simple au départ (on validera le workflow à 3 validations puis livraison SuperCorrector).

## Exigences de sortie
- Propose **l’arborescence** initiale du repo (App Router) avec fichiers **kebab-case**.  
- Donne **migrations Drizzle** complètes + **seeds**.  
- Fournis **extraits de code** prêts à coller (schemas, middleware, guards, services Better-Auth, composants shadcn/ui).  
- Ajoute des **tests unitaires** pour les guards RBAC et le parsing des invitations.  
- Ajoute un **script de dev** (`pnpm dev:seed`) et un **script d’admin** pour promouvoir un user en `Admin`.  
- Documente en bref **comment ajouter une permission** et la propager (DB → seed → guard → UI).  
- Respect strict des **conventions de nommage** ci-dessus.

Si une décision est ambiguë, propose 2 options et tranche avec une recommandation argumentée. Rappelle les **risques de sécurité** (élévation de privilèges, endpoint leakage, CSRF sur actions admin) et montre comment les mitiger (server actions, route handlers protégés, checks côté server, audit logs).

---

# Plan prioritaire
Oui, **implémenter tout le module rôles & permissions** est la bonne prochaine étape : c’est le socle sécurité + gouvernance qui débloque toutes les pages Bureau/CA/Admin et évite de re-écrire après.  
Ordre recommandé :

1. **Schéma RBAC + seeds + guards** (incluant `auditLogs`).  
2. **Brancher le plugin Admin de Better-Auth** (server `admin()` + client `adminClient()`), puis exposer **Membres** (list, filters, set role, reset pwd) et **Rôles** (CRUD permissions).  
3. **Invitations/Whitelist** (import CSV/XLSX avec preview + validation).  
4. **Éditeur tiptap** (MVP) + workflow de validation (3 validations, bypass SuperCorrector).  
5. **Dashboard & Calendrier** (ensuite).

---

**Source doc Better-Auth Admin plugin :** https://www.better-auth.com/docs/plugins/admin
