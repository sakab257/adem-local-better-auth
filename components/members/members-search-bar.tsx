import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface MembersSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * Composant de barre de recherche réutilisable pour les membres
 */
export function MembersSearchBar({
  value,
  onChange,
  placeholder = "Rechercher par nom ou email...",
}: MembersSearchBarProps) {
  return (
    <div className="relative mb-4">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10"
      />
    </div>
  );
}
