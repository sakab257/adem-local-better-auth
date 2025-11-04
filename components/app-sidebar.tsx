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
import { usePathname } from "next/navigation"

// Menu items.
const items = [
    {
        title: "Accueil",
        url: "/",
        icon: LayoutDashboard,
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
        <Sidebar variant="floating" className="pr-0">
        <SidebarHeader className="flex items-center justify-center h-16">Auth Template</SidebarHeader>
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