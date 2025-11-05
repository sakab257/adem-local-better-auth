"use client";

import { BookText, CalendarDays, GraduationCap, Info, LayoutDashboard, ListTodo, Logs, NotebookPen, Settings, ShieldUser, CirclePlus, FileSymlink, PencilLine, SpellCheck } from "lucide-react"

import {
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"

import Link from "next/link"
import { usePathname } from "next/navigation"

interface LinkSidebarProps {
    userPermissions: {
        isAdmin: boolean;
        isModerator: boolean;
        isBureauOrCA: boolean;
        isCorrector: boolean;
    };
}



// Menu items.
const general = [
    {
        title: "Accueil",
        url: "/",
        icon: LayoutDashboard,
    },
    {
        title: "évenements",
        url: "/events",
        icon: CalendarDays,
    },
    {
        title: "tâches",
        url: "/tasks",
        icon: ListTodo,
    },
]

const resources = [
    {
        title: "Cours",
        url: "/courses",
        icon: BookText,
    },
    {
        title: "Exercices",
        url: "/exercises",
        icon: NotebookPen,
    },
    {
        title: "Annales",
        url: "/exams",
        icon: GraduationCap,
    }
]

const audit = [
    {
        title: "Logs",
        url: "/logs",
        icon: Logs,
    }
]

const gestion = [
    {
        title: "écrire",
        url: "/write",
        icon: PencilLine,
    },
    {
        title: "Corriger",
        url: "/correct",
        icon: SpellCheck,
    }

    
]

const moderation = {
    organization: [
        {
            title: "Membres",
            url: "/courses",
            icon: BookText,
        },
        {
            title: "Ajouter",
            url: "/add",
            icon: CirclePlus,
        },
        {
            title: "Invitations",
            url: "/invitations",
            icon: FileSymlink,
        }
    ],
    administration: [
        {
            title: "Rôles",
            url: "/roles",
            icon: ShieldUser,
        },
    ]
}

const others = [
    {
        title: "Feedback",
        url: "/feedback",
        icon: Info,
    },
    {
        title: "Paramètres",
        url:"/settings", 
        icon: Settings
    },
]

const LinkSidebar = ({ userPermissions }: LinkSidebarProps) => {
    const pathname = usePathname();

    return (
        <SidebarContent>

            <SidebarGroup>
            <SidebarGroupLabel>Général</SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                {general.map((item) => {
                    const isActive = pathname === item.url || pathname.startsWith(item.url + '/');

                    return (
                        <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={isActive}
                        >
                            <Link href={item.url}>
                                <item.icon />
                                <span className="capitalize text-xs">{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
                </SidebarMenu>
            </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
            <SidebarGroupLabel>Ressources</SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                {resources.map((item) => {
                    const isActive = pathname === item.url || pathname.startsWith(item.url + '/');

                    return (
                        <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            className="transition-all"
                        >
                            <Link href={item.url}>
                                <item.icon />
                                <span className="capitalize text-xs">{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
                </SidebarMenu>
            </SidebarGroupContent>
            </SidebarGroup>

            {/* Section Audit - visible uniquement pour Admin/Moderateur */}
            {userPermissions.isModerator && (
                <SidebarGroup>
                <SidebarGroupLabel>Audit</SidebarGroupLabel>
                <SidebarGroupContent>
                    <SidebarMenu>
                    {audit.map((item) => {
                        const isActive = pathname === item.url || pathname.startsWith(item.url + '/');

                        return (
                            <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={isActive}
                                className="transition-all"
                            >
                                <Link href={item.url}>
                                    <item.icon />
                                    <span className="capitalize text-xs">{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    })}
                    </SidebarMenu>
                </SidebarGroupContent>
                </SidebarGroup>
            )}

            {/* Section Gestion - visible pour ceux qui peuvent gérer les ressources */}
            {userPermissions.isCorrector && (
                <SidebarGroup>
                <SidebarGroupLabel>Gestion</SidebarGroupLabel>
                <SidebarGroupContent>
                    <SidebarMenu>
                    {gestion.map((item) => {
                        const isActive = pathname === item.url || pathname.startsWith(item.url + '/');

                        return (
                            <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={isActive}
                                className="transition-all"
                            >
                                <Link href={item.url}>
                                    <item.icon />
                                    <span className="capitalize text-xs">{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    })}
                    </SidebarMenu>
                </SidebarGroupContent>
                </SidebarGroup>
            )}

            {/* Section Modération - visible uniquement pour Bureau/CA/Admin */}
            {userPermissions.isBureauOrCA && (
                <SidebarGroup>
                <SidebarGroupLabel>Modération</SidebarGroupLabel>
                <SidebarGroupContent>
                    <SidebarMenu>
                    {moderation.organization.map((item) => {
                        const isActive = pathname === item.url || pathname.startsWith(item.url + '/');

                        return (
                            <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={isActive}
                                className="transition-all"
                            >
                                <Link href={item.url}>
                                    <item.icon />
                                    <span className="capitalize text-xs">{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    })}
                    {/* Administration visible uniquement pour Admin */}
                    {userPermissions.isAdmin && moderation.administration.map((item) => {
                        const isActive = pathname === item.url || pathname.startsWith(item.url + '/');

                        return (
                            <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={isActive}
                                className="transition-all"
                            >
                                <Link href={item.url}>
                                    <item.icon />
                                    <span className="capitalize text-xs">{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    })}
                    </SidebarMenu>
                </SidebarGroupContent>
                </SidebarGroup>
            )}

            <SidebarGroup className="mt-auto pb-2">
            <SidebarGroupLabel>Autres</SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                {others.map((item) => {
                    const isActive = pathname === item.url || pathname.startsWith(item.url + '/');

                    return (
                        <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            className="transition-all"
                        >
                            <Link href={item.url}>
                                <item.icon />
                                <span className="capitalize text-xs">{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
                </SidebarMenu>
            </SidebarGroupContent>
            </SidebarGroup>

        </SidebarContent>
    )
}

export default LinkSidebar