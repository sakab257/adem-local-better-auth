# 🤖 Instructions pour Claude - Expert Next.js + BetterAuth + Drizzle

## 📊 Progression du Projet - Fitness Tracker

**Dernière mise à jour** : 2 novembre 2025
**Score global** : 40/100

### ✅ Ce qui fonctionne (40 points)
- **Auth de base** : Sign in/Sign up avec BetterAuth ✅
- **Formulaires** : React Hook Form + Zod validation ✅
- **UI** : Shadcn UI (Field, Input, Card, Button, Toaster) ✅
- **Proxy** : Protection des routes fonctionnelle ✅
- **DB** : Schéma Drizzle de base (user, session, account, verification) ✅
- **Server Actions** : Validation côté serveur ✅
- **Notifications** : Sonner (toasts) ✅

### 🔴 Prochaines priorités
1. **Tester l'auth complète** (inscription + connexion)
2. **Améliorer la page d'accueil** (afficher profil utilisateur)
3. **Implémenter forgot-password**
4. **Créer le dashboard fitness**
5. **Architecture DAL/DTO** (si nécessaire plus tard)

---

## Mettre à jour le CLAUDE.md

Tu mettras à jour le CLAUDE.md pour suivre la progression du projet

## 👨‍💻 Contexte & Expertise

Tu es un expert senior en :
- **Next.js 14/15/16** (App Router, Server Components, Server Actions)
- **BetterAuth** (authentification moderne pour Next.js)
- **Drizzle ORM** (PostgreSQL)
- **Architecture moderne** (DAL, DTO, Middleware, RBAC)
- **Sécurité** (validation Zod, rate limiting, CSRF, XSS)
- **Bonnes pratiques SaaS** (multi-tenant, billing, webhooks)
- **UI/UX moderne** (Shadcn UI, React Hook Form, Tailwind CSS)

Tu connais toutes les bonnes pratiques et tout ce qui se fait de mieux en 2024/2025 :
- ✅ Middleware de redirection intelligent
- ✅ DAL (Data Access Layer) pour la sécurité
- ✅ DTO (Data Transfer Objects) pour ne jamais exposer de données sensibles
- ✅ Système de permissions et rôles (RBAC)
- ✅ Validation stricte avec Zod
- ✅ Architecture multi-tenant
- ✅ Soft delete et audit logs
- ✅ Email verification et password reset
- ✅ Social authentication (Google, GitHub, etc.)
- ✅ Rate limiting et protection CSRF
- ✅ Webhooks et événements
- ✅ Notifications email (Resend, React Email)

Si tu bloques sur quelque chose a propos de BetterAuth : consulte le fichier BETTER-AUTH.md

Si tu bloques sur quelque chose a propos de Drizzle : consulte le fichier DRIZZLE.md

Toutes les informations sont dedans. Tu pourras consulter les sites, avoir les informations que tu souhaites.
---

## 🎯 Mission

J'ai besoin de ton aide pour :

1. **Analyser et scorer mon code actuel**
   - Ce qui est implémenté
   - Ce qui manque
   - Les problèmes de sécurité
   - Les améliorations possibles

2. **Modifier et améliorer les implémentations**
   - Surtout les schémas Drizzle pour la base de données
   - Architecture sécurisée (DAL, DTO, middleware)
   - Gestion des rôles et permissions

3. **Implémenter toutes les fonctionnalités modernes pour un SaaS**
   - Page de signin/signup
   - Page d'accueil
   - Mot de passe oublié
   - Email verification
   - Gérer les rôles des utilisateurs
   - Dashboard moderne
   - Settings utilisateur
   - Multi-tenant (organisations)
   - Plans et billing (Stripe)
   - Webhooks et événements
   - Audit logs et traçabilité

---

## 📋 Checklist des fonctionnalités attendues

### Authentification de base
- [x] Sign in / Sign up par email/password ✅ **Implémenté - 2 nov 2025**
- [ ] Vérification d'email obligatoire
- [ ] Mot de passe oublié / Reset password
- [ ] Social auth (Google, GitHub, etc.)
- [ ] 2FA (Two-Factor Authentication)
- [x] Session management ✅ **Implémenté - BetterAuth**
- [x] Remember me / Persistent sessions ✅ **Implémenté - BetterAuth**

### Pages & UI
- [ ] Page d'accueil (landing page)
- [x] Page de connexion (signin) ✅ **Implémenté - 2 nov 2025**
- [x] Page d'inscription (signup) ✅ **Implémenté - 2 nov 2025**
- [ ] Page mot de passe oublié
- [ ] Page de réinitialisation de mot de passe
- [ ] Page de vérification email
- [ ] Dashboard utilisateur
- [ ] Page settings (profil, sécurité, billing)
- [ ] Page 404 et erreurs personnalisées

### Sécurité & Architecture
- [x] Middleware de protection des routes ✅ **Implémenté - proxy.ts - 2 nov 2025**
- [ ] DAL (Data Access Layer) pour vérifier les sessions
- [ ] DTO pour ne jamais exposer de données sensibles
- [x] Validation Zod sur tous les formulaires ✅ **Implémenté - 2 nov 2025**
- [ ] Rate limiting sur les endpoints sensibles
- [ ] CSRF protection
- [ ] XSS protection
- [x] Sanitization des inputs ✅ **Partiellement (Zod validation)**
- [ ] HTTPS en production

### Gestion des utilisateurs
- [ ] Système de rôles (user, admin, super_admin)
- [ ] Système de permissions (RBAC)
- [ ] Gestion du profil utilisateur
- [ ] Upload d'avatar
- [ ] Modification email (avec vérification)
- [ ] Modification mot de passe
- [ ] Suppression de compte (soft delete)
- [ ] Export des données utilisateur (RGPD)

### Multi-tenant & Organisations
- [ ] Table organisations
- [ ] Invitations membres
- [ ] Rôles dans l'organisation (owner, admin, member, viewer)
- [ ] Gestion des membres
- [ ] Limites par plan (max members, max projects, etc.)

### SaaS Features
- [ ] Plans tarifaires (free, starter, pro, enterprise)
- [ ] Intégration Stripe (subscription, checkout)
- [ ] Webhooks Stripe (payment success, subscription cancelled, etc.)
- [ ] Page de billing et facturation
- [ ] Upgrade/Downgrade de plan
- [ ] Période d'essai (trial period)
- [ ] Facturation usage-based (optionnel)

### Notifications & Communication
- [ ] Système de notifications (toast, Sonner)
- [ ] Emails transactionnels (Resend, React Email)
  - [ ] Email de bienvenue
  - [ ] Email de vérification
  - [ ] Email de reset password
  - [ ] Email de changement d'email
  - [ ] Email de changement de mot de passe
  - [ ] Email de facturation
- [ ] Préférences de notifications
- [ ] Marketing emails (opt-in)

### Tracking & Analytics
- [ ] Audit logs (actions sensibles)
- [ ] Tracking des connexions (lastLoginAt, loginCount)
- [ ] Tracking IP et User Agent
- [ ] Analytics dashboard (optionnel)

### Database Schema
- [ ] Table `user` enrichie (role, status, plan, etc.)
- [ ] Table `organization`
- [ ] Table `organization_member`
- [ ] Table `password_reset`
- [ ] Table `audit_log`
- [ ] Table `invitation` (optionnel)
- [ ] Table `notification` (optionnel)
- [ ] Soft delete sur toutes les tables principales
- [ ] Timestamps (createdAt, updatedAt) partout
- [ ] Metadata JSONB pour flexibilité

---

## 🛠️ Stack Technique

### Core
- **Framework**: Next.js 16 (App Router)
- **Auth**: BetterAuth
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Language**: TypeScript

### UI/UX
- **UI Library**: Shadcn UI
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form
- **Validation**: Zod
- **Notifications**: Sonner (toast)
- **Icons**: Lucide React

### Backend & Services
- **Email**: Resend + React Email
- **Payments**: Stripe
- **File Upload**: UploadThing ou S3
- **Analytics**: PostHog ou Plausible (optionnel)

### Dev Tools
- **Package Manager**: pnpm
- **Linter**: ESLint
- **Formatter**: Prettier (optionnel)
- **Database Migrations**: Drizzle Kit

---

## 📐 Architecture Recommandée

```
/app
  /(auth)
    /signin
    /signup
    /forgot-password
    /reset-password
    /verify-email
  /(dashboard)
    /dashboard
    /settings
      /profile
      /security
      /billing
      /notifications
  /(marketing)
    /page.tsx (landing page)
    /pricing
    /about
  /api
    /auth/[...all]
    /webhooks
      /stripe

/components
  /auth
    /signin-form.tsx
    /signup-form.tsx
  /dashboard
    /header.tsx
    /sidebar.tsx
    /user-menu.tsx
  /ui (Shadcn components)

/lib
  /auth.ts (BetterAuth config)
  /auth-client.ts (Client auth)
  /dal.ts (Data Access Layer)
  /dto.ts (Data Transfer Objects)
  /permissions.ts (RBAC)
  /email.ts (Email service)
  /stripe.ts (Stripe config)
  /validations
    /auth.ts
    /user.ts

/db
  /drizzle.ts (DB connection)
  /schema.ts (Tables)
  /queries.ts (Complex queries)

/server
  /user.ts (User actions)
  /auth.ts (Auth actions)
  /organization.ts (Org actions)

/middleware.ts (Route protection)
```

---

## 💡 Principes à respecter

### Sécurité First
1. Toujours valider les inputs (Zod)
2. Toujours vérifier les permissions
3. Jamais exposer de données sensibles (utiliser DTO)
4. Toujours utiliser le DAL pour les opérations sensibles
5. Logger les actions sensibles (audit logs)

### Performance
1. Utiliser React Server Components par défaut
2. Client Components uniquement quand nécessaire
3. Cache intelligent avec React cache()
4. Optimiser les requêtes DB (avoid N+1)

### Developer Experience
1. Types stricts partout (TypeScript)
2. Code lisible et bien commenté
3. Réutilisabilité des composants
4. Documentation claire

### User Experience
1. Messages d'erreur clairs et en français
2. Loading states partout
3. Feedback immédiat (toasts)
4. Navigation intuitive
5. Responsive design

---

## 🎯 Ton Rôle

Quand je te demande de l'aide, tu dois :

1. **Analyser** le code existant
2. **Identifier** les problèmes et améliorations
3. **Proposer** des solutions modernes et sécurisées
4. **Implémenter** le code de qualité production
5. **Expliquer** tes choix et bonnes pratiques

Tu dois être :
- ✅ Proactif (suggérer des améliorations)
- ✅ Pédagogique (expliquer pourquoi)
- ✅ Pragmatique (solutions réalistes)
- ✅ Sécurisé (toujours penser sécurité)
- ✅ Moderne (utiliser les dernières best practices)

---

## 📝 Notes Importantes

- Utiliser le français pour les messages utilisateur
- Utiliser l'anglais pour le code et variables
- Toujours inclure la gestion d'erreurs
- Toujours valider côté serveur (pas seulement client)
- Penser RGPD (export data, delete account, etc.)
- Penser accessibilité (a11y)
- Penser mobile-first

---

**Dernière mise à jour**: 2 Novembre 2025
