"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Compact } from "@uiw/react-color";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createRole, type Permission } from "@/server/roles";

// Schema de validation
const createRoleSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Couleur invalide"),
  priority: z.number().int().min(0),
  permissionIds: z.array(z.string()),
});

type CreateRoleForm = z.infer<typeof createRoleSchema>;

interface CreateRoleFormProps {
  permissions: Permission[];
}

export function CreateRoleForm({ permissions }: CreateRoleFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateRoleForm>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      name: "",
      description: "",
      color: "#6366f1",
      priority: 0,
      permissionIds: [],
    },
  });

  const color = watch("color");

  // Grouper les permissions par ressource
  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.resource]) {
      acc[perm.resource] = [];
    }
    acc[perm.resource].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) => {
      const updated = prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId];
      setValue("permissionIds", updated);
      return updated;
    });
  };

  const onSubmit = async (data: CreateRoleForm) => {
    setIsSubmitting(true);

    try {
      const result = await createRole(data);

      if (result.success) {
        toast.success("Rôle créé avec succès");
        router.push("/roles");
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la création du rôle");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Informations générales */}
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
          <CardDescription>
            Définissez le nom, la description et l'apparence du rôle
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Nom */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nom du rôle <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Ex: Modérateur, Correcteur..."
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Décrivez les responsabilités de ce rôle..."
              rows={3}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Couleur et Priorité */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Couleur */}
            <div className="space-y-2">
              <Label>Couleur</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <div
                      className="h-4 w-4 rounded border mr-2"
                      style={{ backgroundColor: color }}
                    />
                    {color}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="start">
                  <Compact
                    color={color}
                    onChange={(newColor) => {
                      setValue("color", newColor.hex);
                    }}
                  />
                </PopoverContent>
              </Popover>
              {errors.color && (
                <p className="text-sm text-destructive">{errors.color.message}</p>
              )}
            </div>

            {/* Priorité */}
            <div className="space-y-2">
              <Label htmlFor="priority">
                Priorité (ordre d'importance)
              </Label>
              <Input
                id="priority"
                type="number"
                min="0"
                placeholder="0"
                {...register("priority", { valueAsNumber: true })}
              />
              {errors.priority && (
                <p className="text-sm text-destructive">{errors.priority.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Plus la valeur est élevée, plus le rôle est prioritaire
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissions */}
      <div className="space-y-4">
        {Object.keys(groupedPermissions).sort().map((resource) => {
          const resourcePerms = groupedPermissions[resource];
          const selectedCount = resourcePerms.filter((p) =>
            selectedPermissions.includes(p.id)
          ).length;

          return (
            <Card key={resource}>
              <CardHeader>
                <CardTitle className="capitalize text-lg">{resource}</CardTitle>
                <CardDescription>
                  {selectedCount} / {resourcePerms.length} permission(s) sélectionnée(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {resourcePerms.map((perm) => (
                    <div key={perm.id} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <Checkbox
                        id={perm.id}
                        checked={selectedPermissions.includes(perm.id)}
                        onCheckedChange={() => togglePermission(perm.id)}
                        className="mt-0.5"
                      />
                      <Label
                        htmlFor={perm.id}
                        className="flex-1 text-sm cursor-pointer"
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
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/roles")}
          disabled={isSubmitting}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Créer le rôle
        </Button>
      </div>
    </form>
  );
}
