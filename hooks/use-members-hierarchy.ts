import { useState, useEffect } from "react";
import { UserWithRoles } from "@/lib/types";
import { canManageUsersAction } from "@/server/members";

/**
 * Hook personnalisé pour gérer la vérification de hiérarchie des membres
 * Effectue un appel batch unique au chargement pour vérifier les permissions de gestion
 */
export function useMembersHierarchy(
  members: UserWithRoles[],
  currentUserId?: string
) {
  // Map pour stocker les permissions de gestion pour chaque membre
  const [canManageMap, setCanManageMap] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkHierarchy = async () => {
      if (!currentUserId) {
        setCanManageMap({});
        setIsLoading(false);
        return;
      }

      // Filtrer les IDs à vérifier (exclure l'utilisateur courant)
      const userIdsToCheck = members
        .filter((member) => member.id !== currentUserId)
        .map((member) => member.id);

      if (userIdsToCheck.length === 0) {
        setCanManageMap({});
        setIsLoading(false);
        return;
      }

      // Appel batch unique pour tous les membres
      const results = await canManageUsersAction(userIdsToCheck);

      // Ajouter l'utilisateur courant avec false (on ne peut pas se gérer soi-même)
      results[currentUserId] = false;

      setCanManageMap(results);
      setIsLoading(false);
    };

    checkHierarchy();
  }, [members, currentUserId]);

  return { canManageMap, isLoading };
}
