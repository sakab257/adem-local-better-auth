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
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  acceptUser,
  rejectUser,
  deleteUser,
  unbanUser,
  resetUserPassword,
  canManageUserAction,
} from "@/server/members";
import { ChangeRoleDialog } from "./change-role-dialog";
import { BanUserDialog } from "./ban-user-dialog";
import { ViewProfileDialog } from "./view-profile-dialog";
import { ResetPasswordDialog } from "./reset-password-dialog";
import { DeleteUserDialog } from "./delete-user-dialog";
import { RejectUserDialog } from "./reject-user-dialog";

interface MembersGridProps {
  members: UserWithRoles[];
  status: UserStatus;
  currentUserId?: string;
  canChangeRoles?: boolean;
}

export function MembersGrid({ members, status, currentUserId, canChangeRoles = false }: MembersGridProps) {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [isChangeRoleOpen, setIsChangeRoleOpen] = useState(false);
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false);
  const [isViewProfileOpen, setIsViewProfileOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Map pour stocker les permissions de gestion pour chaque membre
  const [canManageMap, setCanManageMap] = useState<Record<string, boolean>>({});

  // Vérifier la hiérarchie pour tous les membres au chargement
  useEffect(() => {
    const checkHierarchy = async () => {
      const results: Record<string, boolean> = {};

      await Promise.all(
        members.map(async (member) => {
          if (member.id === currentUserId) {
            results[member.id] = false; // Ne peut pas se gérer soi-même
          } else {
            const { canManage } = await canManageUserAction(member.id);
            results[member.id] = canManage;
          }
        })
      );

      setCanManageMap(results);
    };

    if (currentUserId) {
      checkHierarchy();
    }
  }, [members, currentUserId]);

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

  const handleResetPassword = (member: UserWithRoles) => {
    setSelectedUser(member);
    setIsResetPasswordOpen(true);
  };

  const handleBan = (member: UserWithRoles) => {
    setSelectedUser(member);
    setIsBanDialogOpen(true);
  };

  const handleDelete = (member: UserWithRoles) => {
    setSelectedUser(member);
    setIsDeleteDialogOpen(true);
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

  const handleReject = (member: UserWithRoles) => {
    setSelectedUser(member);
    setIsRejectDialogOpen(true);
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
          const canManage = canManageMap[member.id] ?? false;

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
                          {/* Voir profil : disponible uniquement si on peut gérer l'utilisateur */}
                          {canManage && (
                            <DropdownMenuItem onClick={() => handleViewProfile(member)}>
                              <UserIcon className="h-4 w-4 mr-2" />
                              Voir profil
                            </DropdownMenuItem>
                          )}

                          {/* Actions pour membres actifs */}
                          {status === "active" && canManage && (
                            <>
                              <DropdownMenuSeparator />
                              {/* Changer rôle : uniquement pour Admin et Moderateur */}
                              {canChangeRoles && (
                                <DropdownMenuItem
                                  onClick={() => handleChangeRole(member)}
                                >
                                  <Shield className="h-4 w-4 mr-2" />
                                  Changer rôle
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleResetPassword(member)}
                              >
                                <KeyRound className="h-4 w-4 mr-2" />
                                Reinitialiser MDP
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleBan(member)}
                                className="text-destructive"
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                Bannir
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(member)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </>
                          )}

                          {/* Actions pour membres en attente */}
                          {status === "pending" && canManage && (
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

                          {/* Actions pour membres bannis */}
                          {status === "banned" && canManage && (
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

                          {/* Message si aucune action disponible */}
                          {!canManage && (
                            <div className="px-2 py-1.5 text-xs text-muted-foreground">
                              Aucune action disponible
                            </div>
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
          <ResetPasswordDialog
            user={selectedUser}
            open={isResetPasswordOpen}
            onOpenChange={setIsResetPasswordOpen}
            onSuccess={() => {
              setIsResetPasswordOpen(false);
              setSelectedUser(null);
            }}
          />
          <DeleteUserDialog
            user={selectedUser}
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            onSuccess={() => {
              router.refresh();
              setIsDeleteDialogOpen(false);
              setSelectedUser(null);
            }}
          />
          <RejectUserDialog
            user={selectedUser}
            open={isRejectDialogOpen}
            onOpenChange={setIsRejectDialogOpen}
            onSuccess={() => {
              router.refresh();
              setIsRejectDialogOpen(false);
              setSelectedUser(null);
            }}
          />
        </>
      )}
    </>
  );
}
