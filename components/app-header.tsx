"use client";

import { useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/themes/mode-toggle";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const AppHeader = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <header className="w-full h-16 flex items-center justify-between bg-background">
      {/* Left: Sidebar Trigger */}
      <div className="flex items-center">
        <SidebarTrigger />
      </div>

        {/* Theme Toggle */}
        <ModeToggle />
    </header>
  );
};

export default AppHeader;