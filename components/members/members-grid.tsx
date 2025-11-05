"use client";

import { UserWithRoles, UserStatus } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  MoreVertical,
  Shield,
  KeyRound,
  Ban,
  Trash2,
  CheckCircle,
  XCircle,
  Unlock,
  User as UserIcon,
  Search,
  UserCircle,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  acceptUser,
  rejectUser,
  deleteUser,
  unbanUser,
  resetUserPassword,
} from "@/server/members";
import { ChangeRoleDialog } from "./change-role-dialog";
import { BanUserDialog } from "./ban-user-dialog";
import { ViewProfileDialog } from "./view-profile-dialog";

interface MembersGridProps {
  members: UserWithRoles[];
  status: UserStatus;
  currentUserId?: string;
}

export function MembersGrid({ members, status, currentUserId }: MembersGridProps) {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [isChangeRoleOpen, setIsChangeRoleOpen] = useState(false);
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false);
  const [isViewProfileOpen, setIsViewProfileOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtrer les membres : exclure l'admin et filtrer selon la recherche
  const filteredMembers = members
    .filter((member) => {
      // Exclure les admins
      const isAdmin = member.roles.some((role) => role.name === "Admin");
      if (isAdmin) return false;

      // Recherche
      if (searchQuery) {
        return (
          member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          member.email.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      return true;
    });

  // Actions pour membres actifs
  const handleChangeRole = (member: UserWithRoles) => {
    setSelectedUser(member);
    setIsChangeRoleOpen(true);
  };

  const handleResetPassword = async (member: UserWithRoles) => {
    setLoading(member.id);
    const result = await resetUserPassword(member.id);
    setLoading(null);

    if (result.success) {
      toast.success(`Email de réinitialisation envoyé à ${member.email}`);
    } else {
      toast.error(result.error || "Erreur lors de l'envoi de l'email");
    }
  };

  const handleBan = (member: UserWithRoles) => {
    setSelectedUser(member);
    setIsBanDialogOpen(true);
  };

  const handleDelete = async (member: UserWithRoles) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${member.name} ?`)) {
      return;
    }

    setLoading(member.id);
    const result = await deleteUser(member.id);
    setLoading(null);

    if (result.success) {
      toast.success("Membre supprimé avec succès");
      router.refresh();
    } else {
      toast.error(result.error || "Erreur lors de la suppression");
    }
  };

  // Actions pour membres en attente
  const handleAccept = async (member: UserWithRoles) => {
    setLoading(member.id);
    const result = await acceptUser(member.id);
    setLoading(null);

    if (result.success) {
      toast.success(`${member.name} a été accepté`);
      router.refresh();
    } else {
      toast.error(result.error || "Erreur lors de l'acceptation");
    }
  };

  const handleReject = async (member: UserWithRoles) => {
    if (
      !confirm(
        `Êtes-vous sûr de vouloir rejeter ${member.name} ? Son compte sera supprimé.`
      )
    ) {
      return;
    }

    setLoading(member.id);
    const result = await rejectUser(member.id);
    setLoading(null);

    if (result.success) {
      toast.success(`${member.name} a été rejeté`);
      router.refresh();
    } else {
      toast.error(result.error || "Erreur lors du rejet");
    }
  };

  // Actions pour membres bannis
  const handleUnban = async (member: UserWithRoles) => {
    setLoading(member.id);
    const result = await unbanUser(member.id);
    setLoading(null);

    if (result.success) {
      toast.success(`${member.name} a été débanni`);
      router.refresh();
    } else {
      toast.error(result.error || "Erreur lors du débannissement");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getPrimaryRole = (roles: UserWithRoles["roles"]) => {
    if (roles.length === 0) return null;
    return roles.sort((a, b) => b.priority - a.priority)[0];
  };

  const handleViewProfile = (member: UserWithRoles) => {
    setSelectedUser(member);
    setIsViewProfileOpen(true);
  };

  if (members.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Aucun membre dans cette catégorie</p>
      </div>
    );
  }

  return (
    <>
      {/* Barre de recherche */}
      <div className="relative mb-4">
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
            {searchQuery
              ? "Aucun membre ne correspond à votre recherche"
              : "Aucun membre dans cette catégorie"}
          </p>
        </div>
      ) : (
        <div className="divide-y flex flex-col gap-2">
          {filteredMembers.map((member) => {
          const primaryRole = getPrimaryRole(member.roles);
          const isLoading = loading === member.id;
          const isCurrentUser = member.id === currentUserId;

          return (
            <Card key={member.id} className="hover:shadow-md transition-shadow">
              <CardContent className="">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.image || undefined} />
                    <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                  </Avatar>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">
                          {member.name}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">
                          {member.email}
                        </p>
                      </div>

                      {/* Rôles */}
                      <div className="flex flex-wrap gap-1">
                        {primaryRole && (
                          <Badge
                            variant="secondary"
                            className="text-xs font-semibold px-4"
                            style={{
                              backgroundColor: primaryRole.color
                                ? `${primaryRole.color}`
                                : undefined,
                              borderColor: primaryRole.color || undefined,
                            }}
                          >
                            {primaryRole.name}
                          </Badge>
                        )}
                        {member.roles.length > 1 && (
                          <Badge variant="outline" className="text-xs">
                            +{member.roles.length - 1}
                          </Badge>
                        )}
                      </div>
                      {!isCurrentUser && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              disabled={isLoading}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewProfile(member)}>
                            <UserIcon className="h-4 w-4 mr-2" />
                            Voir profil
                          </DropdownMenuItem>

                          {status === "active" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleChangeRole(member)}
                              >
                                <Shield className="h-4 w-4 mr-2" />
                                Changer rôle
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleResetPassword(member)}
                              >
                                <KeyRound className="h-4 w-4 mr-2" />
                                Reinitialiser mot de passe
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleBan(member)}
                                className="text-destructive"
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                Bannir
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild
                                // onClick={() => handleDelete(member)}
                                className="text-destructive"
                              >
                                {/* Bouton supprimer */}
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <div className="flex text-destructive">
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Supprimer le rôle
                                    </div>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                          Cette action est irréversible. Le rôle sera définitivement supprimé.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                                      <AlertDialogAction
                                        // onClick={handleDelete(member)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Oui, supprimer
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                                {/* <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer */}
                              </DropdownMenuItem>
                            </>
                          )}

                          {status === "pending" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleAccept(member)}
                                className="text-validate"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Accepter
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleReject(member)}
                                className="text-destructive"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Rejeter
                              </DropdownMenuItem>
                            </>
                          )}

                          {status === "banned" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleUnban(member)}>
                                <Unlock className="h-4 w-4 mr-2" />
                                Débannir
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(member)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer définitivement
                              </DropdownMenuItem>
                            </>
                          )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>


                    {/* Statut / Info supplémentaire */}
                    {/* <div className="mt-2 text-xs text-muted-foreground">
                      {status === "banned" && member.banReason && (
                        <p className="text-destructive">
                          Raison: {member.banReason}
                        </p>
                      )}
                      {status === "pending" && (
                        <p>
                          Inscrit le{" "}
                          {new Date(member.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                      )}
                      {status === "active" && (
                        <p>
                          {member.emailVerified ? "✓ Email vérifié" : "⚠ Email non vérifié"}
                        </p>
                      )}
                    </div> */}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      )}

      {/* Dialogs */}
      {selectedUser && (
        <>
          <ViewProfileDialog
            user={selectedUser}
            open={isViewProfileOpen}
            onOpenChange={setIsViewProfileOpen}
            onSuccess={() => {
              router.refresh();
              setIsViewProfileOpen(false);
            }}
          />
          <ChangeRoleDialog
            user={selectedUser}
            open={isChangeRoleOpen}
            onOpenChange={setIsChangeRoleOpen}
            onSuccess={() => {
              router.refresh();
              setIsChangeRoleOpen(false);
              setSelectedUser(null);
            }}
          />
          <BanUserDialog
            user={selectedUser}
            open={isBanDialogOpen}
            onOpenChange={setIsBanDialogOpen}
            onSuccess={() => {
              router.refresh();
              setIsBanDialogOpen(false);
              setSelectedUser(null);
            }}
          />
        </>
      )}
    </>
  );
}
