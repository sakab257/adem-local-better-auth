"use client";

import { UserWithRoles } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { setUserRoles, getAllRoles, getManageableRoles } from "@/server/members";

interface ChangeRoleDialogProps {
  user: UserWithRoles;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ChangeRoleDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: ChangeRoleDialogProps) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [availableRoles, setAvailableRoles] = useState<
    Array<{ id: string; name: string; color: string | null; priority: number }>
  >([]);
  const [loading, setLoading] = useState(false);

  // Charger les rôles disponibles
  useEffect(() => {
    async function loadRoles() {
      const result = await getManageableRoles();

      if (result.success && result.data) {
        setAvailableRoles(result.data);
      } else {
        console.error("Erreur lors du chargement des rôles:", result.error);
        toast.error(result.error || "Impossible de charger les rôles");
      }
    }

    if (open) {
      loadRoles();
      setSelectedRoles(user.roles.map((r) => r.id));
    }
  }, [open, user]);

  const handleToggleRole = (roleId: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    const result = await setUserRoles(user.id, selectedRoles);
    setLoading(false);

    if (result.success) {
      toast.success("Rôles modifiés avec succès");
      onSuccess();
    } else {
      toast.error(result.error || "Erreur lors de la modification des rôles");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier les rôles</DialogTitle>
          <DialogDescription>
            Sélectionnez les rôles pour <strong>{user.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {availableRoles.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : (
            availableRoles
              .filter((role) => role.name !== "Admin")
              .sort((a, b) => b.priority - a.priority)
              .map((role) => (
                <div key={role.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={role.id}
                    checked={selectedRoles.includes(role.id)}
                    onCheckedChange={() => handleToggleRole(role.id)}
                  />
                  <Label
                    htmlFor={role.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    <span
                      className="inline-block px-2 py-1 rounded text-xs"
                      style={{
                        backgroundColor: role.color
                          ? `${role.color}20`
                          : undefined,
                        borderColor: role.color || undefined,
                        border: "1px solid",
                      }}
                    >
                      {role.name}
                    </span>
                  </Label>
                </div>
              ))
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
