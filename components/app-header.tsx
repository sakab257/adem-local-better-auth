import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/mode-toggle";

const AppHeader = () => {
    return (
        <header className='w-full h-16 bg-destructive'>
            <SidebarTrigger />
            <ModeToggle />
        </header>
    )
}

export default AppHeader