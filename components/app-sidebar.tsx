import {
    Sidebar,
    SidebarFooter,
    SidebarHeader,
    SidebarSeparator,
} from "@/components/ui/sidebar"

import SignOutButton from "./auth/sign-out-button"
import Image from "next/image";
import LinkSidebar from "./links-sidebar";

export function AppSidebar() {
    

    return (
        <Sidebar variant="floating" className="pr-0">
        <SidebarHeader className="flex items-center justify-center h-16">
            <Image src={'/adem_logo.svg'} alt="Logo de l'ADEM" width={35} height={35}/>
        </SidebarHeader>
        <SidebarSeparator className="mx-auto"/>
        <LinkSidebar />
        <SidebarSeparator className="mx-auto"/>
        <SidebarFooter>
            <SignOutButton />
        </SidebarFooter>
        </Sidebar>
    )
}