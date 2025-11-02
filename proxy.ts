import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from './lib/auth'

// Définir les routes publiques et d'authentification
const authRoutes = ['/auth/sign-in', '/auth/sign-up', '/auth/forgot-password', '/auth/reset-password']


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

    // Par défaut, toutes les routes sont protégées sauf auth et public
    const isProtectedRoute = !isAuthRoute

    // Rediriger les utilisateurs non connectés des routes protégées
    if (isProtectedRoute && !session?.user) {
        const signInUrl = new URL('/auth/sign-in', request.url)
        // Ajouter l'URL de retour pour rediriger après connexion
        signInUrl.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(signInUrl)
    }

    // Rediriger les utilisateurs connectés hors des pages d'auth
    if (isAuthRoute && session?.user) {
        return NextResponse.redirect(new URL('/', request.url))
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