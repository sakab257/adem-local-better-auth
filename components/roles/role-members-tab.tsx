"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2, UserCircle } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { removeUserFromRole } from "@/server/roles";
import { RoleMember } from "@/lib/types";

interface RoleMembersTabProps {
  roleId: string;
  members: RoleMember[];
}

export function RoleMembersTab({ roleId, members }: RoleMembersTabProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [memberToRemove, setMemberToRemove] = useState<RoleMember | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Filtrer les membres selon la recherche
  const filteredMembers = members.filter(
    (member) =>
      member.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    setIsRemoving(true);

    try {
      const result = await removeUserFromRole(memberToRemove.userId, roleId);

      if (result.success) {
        toast.success("Membre retiré du rôle avec succès");
        setMemberToRemove(null);
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors du retrait");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom ou email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Liste des membres */}
      {filteredMembers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <UserCircle className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            {members.length === 0
              ? "Aucun membre n'a ce rôle"
              : "Aucun membre ne correspond à votre recherche"}
          </p>
        </div>
      ) : (
        <div className="divide-y border rounded-lg">
          {filteredMembers.map((member) => (
            <div
              key={member.userId}
              className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <Avatar>
                  <AvatarImage src={member.userImage || undefined} alt={member.userName} />
                  <AvatarFallback>
                    {member.userName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{member.userName}</p>
                  <p className="text-sm text-muted-foreground truncate">{member.userEmail}</p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setMemberToRemove(member)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Dialog de confirmation */}
      <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer ce membre du rôle ?</AlertDialogTitle>
            <AlertDialogDescription>
              {memberToRemove && (
                <>
                  <strong>{memberToRemove.userName}</strong> ({memberToRemove.userEmail}) sera
                  retiré de ce rôle. Si c'est son dernier rôle, il recevra automatiquement le rôle
                  "Membre".
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              disabled={isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Oui, retirer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
