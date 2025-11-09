"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { createMember } from "@/server/members";
import { CreateMemberSchema, CreateMemberFormData } from "@/lib/validations/member";
import { CreateMemberInput } from "@/lib/types";

interface AddMemberFormProps {
  availableRoles: Array<{
    id: string;
    name: string;
    color: string | null;
    priority: number;
  }>;
}

export function AddMemberForm({ availableRoles }: AddMemberFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateMemberFormData>({
    resolver: zodResolver(CreateMemberSchema),
    defaultValues: {
      email: "",
      name: "",
      roleId: "",
      status: "active",
    },
  });

  const selectedStatus = watch("status");
  const selectedRoleId = watch("roleId");

  const onSubmit = async (data: CreateMemberFormData) => {
    setIsSubmitting(true);

    try {
      const input: CreateMemberInput = CreateMemberSchema.parse(data);

      const result = await createMember(input);

      if (result.success) {
        toast.success("Membre créé avec succès");
        toast.info("Un email de bienvenue a été envoyé à l'utilisateur");
        router.push("/members");
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la création du membre");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Une erreur inattendue s'est produite");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Créer un nouveau membre</CardTitle>
        <CardDescription>
          Remplissez les informations ci-dessous pour créer un nouveau membre.
          Un email de bienvenue sera automatiquement envoyé avec un lien pour
          définir son mot de passe.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="prenom.nom@dauphine.eu"
              {...register("email")}
              disabled={isSubmitting}
            />
            {errors.email && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.email.message}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Nom */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nom complet <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Prénom NOM"
              {...register("name")}
              disabled={isSubmitting}
            />
            {errors.name && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.name.message}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Rôle */}
          <div className="space-y-2">
            <Label htmlFor="roleId">
              Rôle <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedRoleId}
              onValueChange={(value) => setValue("roleId", value)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="roleId">
                <SelectValue placeholder="Sélectionnez un rôle" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    Aucun rôle disponible
                  </div>
                ) : (
                  availableRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      <div className="flex items-center gap-2">
                        {role.color && (
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: role.color }}
                          />
                        )}
                        <span>{role.name}</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.roleId && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.roleId.message}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Statut */}
          <div className="space-y-2">
            <Label htmlFor="status">
              Statut <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedStatus}
              onValueChange={(value: "active" | "pending") =>
                setValue("status", value)
              }
              disabled={isSubmitting}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Sélectionnez un statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span>Actif</span>
                  </div>
                </SelectItem>
                <SelectItem value="pending">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-yellow-500" />
                    <span>En attente</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.status.message}</AlertDescription>
              </Alert>
            )}
            <p className="text-sm text-muted-foreground">
              {selectedStatus === "active"
                ? "Le membre pourra se connecter immédiatement après avoir défini son mot de passe"
                : "Le membre devra être accepté manuellement avant de pouvoir se connecter"}
            </p>
          </div>

          {/* Info Box */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Note :</strong> Un mot de passe temporaire sécurisé sera
              généré automatiquement. L'utilisateur recevra un email de bienvenue
              avec un lien pour définir son propre mot de passe. Ce lien expirera
              dans 24 heures.
            </AlertDescription>
          </Alert>

          {/* Boutons */}
          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting || availableRoles.length === 0}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Création en cours..." : "Créer le membre"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
