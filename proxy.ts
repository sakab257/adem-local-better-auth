import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { can, canAll } from '@/lib/rbac'

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

    // Par défaut, toutes les routes sont protégées sauf auth et pending
    const isProtectedRoute = !isAuthRoute && !isPendingRoute

    // Rediriger les utilisateurs non connectés des routes protégées
    if (isProtectedRoute && !session?.user) {
        const signInUrl = new URL('/auth/sign-in', request.url)
        return NextResponse.redirect(signInUrl)
    }

    // ============================================
    // SÉCURITÉ : Vérifier que l'email est vérifié
    // Si l'utilisateur est connecté MAIS email non vérifié, bloquer l'accès
    // ============================================
    if (isProtectedRoute && session?.user && !session.user.emailVerified) {
        const signInUrl = new URL('/auth/sign-in', request.url)
        return NextResponse.redirect(signInUrl)
    }

    // ============================================
    // SÉCURITÉ : Rediriger les utilisateurs avec status 'pending' vers /pending
    // Sauf s'ils sont déjà sur la page /pending ou sur les routes d'auth
    // ============================================
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
    // PROTECTION RBAC - Routes par rôle
    // ============================================

    // Protection /roles/** - Réservé aux Admins et Modérateurs et autres...
    if (pathname.startsWith('/roles') && session?.user) {
        const canSeeRoles = await can(session.user.id,"roles:read");

        if (!canSeeRoles) {
            return NextResponse.redirect(new URL('/', request.url))
        }
    }

    // Protection /membres/** - Réservé à l'Admin, Moderateurs, Bureau et CA et autres...
    if (pathname.startsWith('/members') && session?.user) {
        const canSeeMembers = await can(session.user.id,"members:read");

        if (!canSeeMembers) {
            return NextResponse.redirect(new URL('/', request.url))
        }
    }

    // Protection /invitations/** - Réservé à l'Admin, Moderateurs, Bureau et CA et autres...
    if (pathname.startsWith('/invitations') && session?.user) {
        const canSeeMembers = await canAll(session.user.id, ["members:read","members:invite"]);

        if (!canSeeMembers) {
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