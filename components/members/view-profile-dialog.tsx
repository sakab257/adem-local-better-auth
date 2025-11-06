"use client";

import { UserWithRoles } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, Calendar, Shield, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ViewProfileDialogProps {
  user: UserWithRoles;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ViewProfileDialog({
  user,
  open,
  onOpenChange,
}: ViewProfileDialogProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "suspended":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "banned":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Actif";
      case "pending":
        return "En attente";
      case "suspended":
        return "Suspendu";
      case "banned":
        return "Banni";
      default:
        return status;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Profil du membre</DialogTitle>
          <DialogDescription>
            Informations détaillées du compte utilisateur
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Avatar et infos principales */}
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.image || undefined} alt={user.name} />
              <AvatarFallback className="text-2xl">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div>
                <h3 className="text-xl font-semibold">{user.name}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Mail className="h-4 w-4" />
                  <span>{user.email}</span>
                  {user.emailVerified && (
                    <Badge variant="outline" className="text-xs">
                      ✓ Vérifié
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(user.status)}>
                  {getStatusLabel(user.status)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Rôles */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Rôles
            </h4>
            <div className="flex flex-wrap gap-2">
              {user.roles.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucun rôle assigné
                </p>
              ) : (
                user.roles
                  .sort((a, b) => b.priority - a.priority)
                  .map((role) => (
                    <Badge
                      key={role.id}
                      variant="secondary"
                      style={{
                        backgroundColor: role.color
                          ? `${role.color}20`
                          : undefined,
                        borderColor: role.color || undefined,
                        border: "1px solid",
                      }}
                    >
                      {role.name}
                    </Badge>
                  ))
              )}
            </div>
          </div>

          {/* Date d'inscription */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date d'inscription
            </h4>
            <p className="text-sm text-muted-foreground">
              {format(new Date(user.createdAt), "PPP 'à' HH:mm", {
                locale: fr,
              })}
            </p>
          </div>

          {/* Informations de bannissement */}
          {user.banned && (
            <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-red-800">
                <AlertCircle className="h-4 w-4" />
                Informations de bannissement
              </h4>
              {user.banReason && (
                <p className="text-sm text-red-700 mb-2">
                  <span className="font-medium">Raison :</span> {user.banReason}
                </p>
              )}
              <p className="text-sm text-red-700">
                <span className="font-medium">Type :</span>{" "}
                {user.banExpiresAt ? (
                  <>
                    Bannissement temporaire - Expire le{" "}
                    {format(new Date(user.banExpiresAt), "PPP 'à' HH:mm", {
                      locale: fr,
                    })}
                  </>
                ) : (
                  "Bannissement permanent"
                )}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
