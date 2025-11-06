"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateRolePermissions, type Permission } from "@/server/roles";

interface RolePermissionsTabProps {
  roleId: string;
  allPermissions: Permission[];
  currentPermissions: Permission[];
}

export function RolePermissionsTab({
  roleId,
  allPermissions,
  currentPermissions,
}: RolePermissionsTabProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    currentPermissions.map((p) => p.id)
  );
  const [hasChanges, setHasChanges] = useState(false);

  // Grouper les permissions par ressource
  const groupedPermissions = allPermissions.reduce((acc, perm) => {
    if (!acc[perm.resource]) {
      acc[perm.resource] = [];
    }
    acc[perm.resource].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  const getRoleResources = (status: string) => {
    switch (status) {
      case "events":
        return "évenements";
      case "feedback":
        return "feedback";
      case "logs":
        return "logs";
      case "members":
        return "membres";
      case "resources":
        return "ressources";
      case "roles":
        return "rôles";
      case "tasks":
        return "tâches";
      default:
        return "Permission";
    }
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) => {
      const updated = prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId];
      setHasChanges(true);
      return updated;
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const result = await updateRolePermissions(roleId, selectedPermissions);

      if (result.success) {
        toast.success("Permissions mises à jour avec succès");
        setHasChanges(false);
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedPermissions(currentPermissions.map((p) => p.id));
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      {/* Grille de cards par ressource */}
      <div className="space-y-4">
        {Object.keys(groupedPermissions).sort().map((resource) => {
          const resourcePerms = groupedPermissions[resource];
          const selectedCount = resourcePerms.filter((p) =>
            selectedPermissions.includes(p.id)
          ).length;

          return (
            <Card key={resource}>
              <CardHeader>
                <CardTitle className="capitalize text-lg">{getRoleResources(resource)}</CardTitle>
                <CardDescription>
                  {selectedCount} / {resourcePerms.length} permission(s) activée(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {resourcePerms.map((perm) => (
                    <div key={perm.id} className="flex items-center rounded-lg border hover:bg-muted/50 transition-colors">
                      <Checkbox
                        id={perm.id}
                        checked={selectedPermissions.includes(perm.id)}
                        onCheckedChange={() => togglePermission(perm.id)}
                        className="mt-0.5 ml-2 cursor-pointer"
                      />
                      <Label
                        htmlFor={perm.id}
                        className="flex-1 text-sm cursor-pointer w-full h-full p-3"
                      >
                        {perm.description || perm.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Actions */}
      {hasChanges && (
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={handleReset} disabled={isSubmitting}>
            Réinitialiser
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sauvegarder
          </Button>
        </div>
      )}
    </div>
  );
}
