import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from './lib/auth'
import { isAdmin, isModerator, isBureauOrCA } from './lib/rbac'

// Définir les routes publiques et d'authentification
const authRoutes = ['/auth/sign-in', '/auth/sign-up', '/auth/forgot-password', '/auth/reset-password']
const pendingRoute = '/pending'


export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Récupérer la session côté serveur avec BetterAuth
    const session = await auth.api.getSession({
        headers: request.headers
    })

    // Vérifier si c'est une route d'authentification
    const isAuthRoute = authRoutes.some(route =>
        pathname.startsWith(route)
    )

    // Vérifier si c'est la route /pending
    const isPendingRoute = pathname === pendingRoute

    // Par défaut, toutes les routes sont protégées sauf auth, pending et public
    const isProtectedRoute = !isAuthRoute && !isPendingRoute

    // Rediriger les utilisateurs non connectés des routes protégées
    if (isProtectedRoute && !session?.user) {
        const signInUrl = new URL('/auth/sign-in', request.url)
        // Ajouter l'URL de retour pour rediriger après connexion
        signInUrl.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(signInUrl)
    }

    // ⚠️ SÉCURITÉ : Vérifier que l'email est vérifié
    // Si l'utilisateur est connecté MAIS email non vérifié, bloquer l'accès
    if (isProtectedRoute && session?.user && !session.user.emailVerified) {
        const signInUrl = new URL('/auth/sign-in', request.url)
        signInUrl.searchParams.set('error', 'email-not-verified')
        signInUrl.searchParams.set('message', 'Veuillez vérifier votre adresse email pour continuer')
        return NextResponse.redirect(signInUrl)
    }

    // ⚠️ SÉCURITÉ : Rediriger les utilisateurs avec status 'pending' vers /pending
    // Sauf s'ils sont déjà sur la page /pending ou sur les routes d'auth
    if (isProtectedRoute && session?.user && session.user.emailVerified) {
        // Récupérer le statut de l'utilisateur depuis la DB
        const { db } = await import('./db/drizzle')
        const { user } = await import('./db/schema')
        const { eq } = await import('drizzle-orm')

        const userRecord = await db.query.user.findFirst({
            where: eq(user.id, session.user.id),
        })

        if (userRecord?.status === 'pending') {
            return NextResponse.redirect(new URL(pendingRoute, request.url))
        }
    }

    // Rediriger les utilisateurs connectés (avec email vérifié et status != pending) hors des pages d'auth
    if (isAuthRoute && session?.user && session.user.emailVerified) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    // ============================================
    // 🔐 PROTECTION RBAC - Routes par rôle
    // ============================================

    // Protection /roles/** - Réservé aux Admins et Modérateurs
    if (pathname.startsWith('/roles') && session?.user) {
        const userIsModerator = await isModerator(session.user.id)

        if (!userIsModerator) {
            return NextResponse.redirect(new URL('/', request.url))
        }
    }

    // Protection /bureau/** - Réservé aux Admins, Bureau et CA
    if (pathname.startsWith('/bureau') && session?.user) {
        const userIsBureauOrCA = await isBureauOrCA(session.user.id)

        if (!userIsBureauOrCA) {
            return NextResponse.redirect(new URL('/', request.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files (images, etc)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}