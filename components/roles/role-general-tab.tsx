"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Block } from "@uiw/react-color";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { updateRole, deleteRole, type Role } from "@/server/roles";

const updateRoleSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Couleur invalide"),
  priority: z.number().int().min(0),
});

type UpdateRoleForm = z.infer<typeof updateRoleSchema>;

interface RoleGeneralTabProps {
  role: Role;
  memberCount: number;
}

export function RoleGeneralTab({ role, memberCount }: RoleGeneralTabProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    watch,
  } = useForm<UpdateRoleForm>({
    resolver: zodResolver(updateRoleSchema),
    defaultValues: {
      name: role.name,
      description: role.description || "",
      color: role.color || "#6366f1",
      priority: role.priority,
    },
  });

  const color = watch("color");

  const onSubmit = async (data: UpdateRoleForm) => {
    setIsSubmitting(true);

    try {
      const result = await updateRole(role.id, data);

      if (result.success) {
        toast.success("Rôle mis à jour avec succès");
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

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const result = await deleteRole(role.id);

      if (result.success) {
        toast.success("Rôle supprimé avec succès");
        router.push("/roles");
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Nom */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Nom du rôle <span className="text-destructive">*</span>
        </Label>
        <Input id="name" {...register("name")} />
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
                type="button"
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
              <Block
                color={color}
                onChange={(newColor) => {
                  setValue("color", newColor.hex, { shouldDirty: true });
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
          <Label htmlFor="priority">Priorité (ordre d'importance)</Label>
          <Input
            id="priority"
            type="number"
            min="0"
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

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        {/* Bouton supprimer */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="destructive" disabled={isDeleting}>
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer le rôle
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
              <AlertDialogDescription>
                {memberCount > 0 ? (
                  <>
                    Ce rôle est attribué à <strong>{memberCount}</strong>{" "}
                    {memberCount === 1 ? "membre" : "membres"}. Si vous supprimez
                    ce rôle, il sera retiré de tous les utilisateurs et ils
                    recevront automatiquement le rôle "Membre" s'ils n'ont aucun
                    autre rôle.
                  </>
                ) : (
                  "Cette action est irréversible. Le rôle sera définitivement supprimé."
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Oui, supprimer le rôle
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Bouton sauvegarder */}
        <Button type="submit" disabled={!isDirty || isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sauvegarder
        </Button>
      </div>
    </form>
  );
}
