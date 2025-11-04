import AppHeader from '@/components/app-header';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import React from 'react'

export default function RootLayout({
    children,
    }: Readonly<{
    children: React.ReactNode;
    }>) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <main className='w-full h-svh overflow-hidden flex flex-col pb-2 px-2'>
                <AppHeader />
                <div className="flex-1 overflow-y-auto rounded-2xl border-sidebar-border border">
                    {children}
                </div>
            </main>
        </SidebarProvider>
    );
}