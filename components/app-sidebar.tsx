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
import { can } from "@/lib/rbac";

export async function AppSidebar() {
    // Récupérer la session côté serveur
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    // Rediriger si pas de session
    if (!session?.user) {
        redirect("/sign-in");
    }

    // Récupérer les permissions de l'utilisateur (basé sur les permissions, pas les rôles)
    const userPermissions = {
        // Événements
        canReadEvents: await can(session.user.id, "events:read"),

        // Ressources (Cours, Exercices, Annales)
        canReadResources: await can(session.user.id, "resources:read"),
        canCreateResources: await can(session.user.id, "resources:create"),
        canValidateResources: await can(session.user.id, "resources:validate"),

        // Membres
        canReadMembers: await can(session.user.id, "members:read"),
        canCreateMembers: await can(session.user.id, "members:create"),
        canInviteMembers: await can(session.user.id, "members:invite"),

        // Rôles
        canReadRoles: await can(session.user.id, "roles:read"),

        // Audit Logs
        canReadLogs: await can(session.user.id, "logs:read"),

        // Tâches
        canReadTasks: await can(session.user.id, "tasks:read"),
    };

    return (
        <Sidebar variant="floating" className="pr-0">
        <SidebarHeader className="flex items-center justify-center h-16">
            <Image src={'/adem_logo.svg'} alt="Logo de l'ADEM" width={50} height={50}/>
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