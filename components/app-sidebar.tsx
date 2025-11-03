"use client";

import { Beef, ChartSpline, Dumbbell, Goal, HeartPulse, LayoutDashboard, Settings } from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator,
} from "@/components/ui/sidebar"

import Link from "next/link"
import SignOutButton from "./auth/sign-out-button"
import clsx from "clsx"
import { usePathname } from "next/navigation"

// Menu items.
const items = [
    {
        title: "Accueil",
        url: "/",
        icon: LayoutDashboard,
    },
    {
        title: "Entraînements",
        url: "#",
        icon: Dumbbell,
    },
    {
        title: "Nutrition",
        url: "#",
        icon: Beef,
    },
    {
        title: "Profil",
        url: "#",
        icon: HeartPulse,
    },
    {
        title: "Objectifs",
        url: "#",
        icon: Goal,
    },
    {
        title: "Analyse", 
        url:"#", 
        icon: ChartSpline
    },
    {
        title: "Paramètres",
        url:"/settings", 
        icon: Settings
    },
]

export function AppSidebar() {
    const pathname = usePathname();

    return (
        <Sidebar>
        <SidebarHeader className="flex items-center justify-center h-16">Sanity Workout</SidebarHeader>
        <SidebarSeparator className="mx-auto"/>
        <SidebarContent>
            <SidebarGroup>
            <SidebarGroupContent>
                <SidebarMenu>
                {items.map((item) => {
                    const isActive = pathname === item.url || pathname.startsWith(item.url + '/');

                    return (
                        <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={isActive}
                        >
                            <Link href={item.url}>
                                <item.icon />
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
                </SidebarMenu>
            </SidebarGroupContent>
            </SidebarGroup>
        </SidebarContent>
        <SidebarSeparator className="mx-auto"/>
        <SidebarFooter>
            <SignOutButton />
        </SidebarFooter>
        </Sidebar>
    )
}