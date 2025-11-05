import {
    Sidebar,
    SidebarFooter,
    SidebarHeader,
    SidebarSeparator,
} from "@/components/ui/sidebar"

import SignOutButton from "./auth/sign-out-button"
import Image from "next/image";
import LinkSidebar from "./links-sidebar";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAdmin, isModerator, isBureauOrCA, isCorrector } from "@/lib/rbac";

export async function AppSidebar() {
    // Récupérer la session côté serveur
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    // Rediriger si pas de session
    if (!session?.user) {
        redirect("/sign-in");
    }

    // Récupérer les permissions de l'utilisateur
    const userPermissions = {
        isAdmin: await isAdmin(session.user.id),
        isModerator: await isModerator(session.user.id),
        isBureauOrCA: await isBureauOrCA(session.user.id),
        isCorrector: await isCorrector(session.user.id)
    };

    return (
        <Sidebar variant="floating" className="pr-0">
        <SidebarHeader className="flex items-center justify-center h-16">
            <Image src={'/adem_logo.svg'} alt="Logo de l'ADEM" width={35} height={35}/>
        </SidebarHeader>
        <SidebarSeparator className="mx-auto"/>
            <LinkSidebar userPermissions={userPermissions} />
        <SidebarSeparator className="mx-auto"/>
        <SidebarFooter>
            <SignOutButton />
        </SidebarFooter>
        </Sidebar>
    )
}