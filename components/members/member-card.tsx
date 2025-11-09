import { UserWithRoles, UserStatus } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";

interface MemberCardProps {
  member: UserWithRoles;
  status: UserStatus;
  isCurrentUser: boolean;
  isLoading: boolean;
  canManage: boolean;
  canChangeRoles: boolean;
  onViewProfile: (member: UserWithRoles) => void;
  onChangeRole: (member: UserWithRoles) => void;
  onResetPassword: (member: UserWithRoles) => void;
  onBan: (member: UserWithRoles) => void;
  onDelete: (member: UserWithRoles) => void;
  onAccept: (member: UserWithRoles) => void;
  onReject: (member: UserWithRoles) => void;
  onUnban: (member: UserWithRoles) => void;
}

/**
 * Composant carte de membre avec dropdown d'actions
 * Gère l'affichage d'un membre individuel et ses actions contextuelles
 */
export function MemberCard({
  member,
  status,
  isCurrentUser,
  isLoading,
  canManage,
  canChangeRoles,
  onViewProfile,
  onChangeRole,
  onResetPassword,
  onBan,
  onDelete,
  onAccept,
  onReject,
  onUnban,
}: MemberCardProps) {
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

  const primaryRole = getPrimaryRole(member.roles);

  return (
    <Card className="hover:shadow-md transition-shadow">
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

              {/* Dropdown Actions */}
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
                      <DropdownMenuItem onClick={() => onViewProfile(member)}>
                        <UserIcon className="h-4 w-4 mr-2" />
                        Voir profil
                      </DropdownMenuItem>
                    )}

                    {/* Actions pour membres actifs */}
                    {status === "active" && canManage && (
                      <>
                        <DropdownMenuSeparator />
                        {/* Changer rôle : uniquement pour ceux qui ont la permission */}
                        {canChangeRoles && (
                          <DropdownMenuItem
                            onClick={() => onChangeRole(member)}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Changer rôle
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => onResetPassword(member)}
                        >
                          <KeyRound className="h-4 w-4 mr-2" />
                          Reinitialiser MDP
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onBan(member)}
                          className="text-destructive"
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          Bannir
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(member)}
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
                          onClick={() => onAccept(member)}
                          className="text-validate"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Accepter
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onReject(member)}
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
                        <DropdownMenuItem onClick={() => onUnban(member)}>
                          <Unlock className="h-4 w-4 mr-2" />
                          Débannir
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(member)}
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
