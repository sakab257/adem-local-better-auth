import { useState, useMemo } from "react";
import { UserWithRoles } from "@/lib/types";

/**
 * Hook personnalisé pour gérer le filtrage et la recherche des membres
 * Filtre les admins automatiquement et applique la recherche par nom/email
 */
export function useMembersFilter(members: UserWithRoles[]) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filtrer les membres : exclure les admins et appliquer la recherche
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      // Exclure les admins
      const isAdmin = member.roles.some((role) => role.name === "Admin");
      if (isAdmin) return false;

      // Recherche par nom ou email
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          member.name.toLowerCase().includes(query) ||
          member.email.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [members, searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    filteredMembers,
  };
}
