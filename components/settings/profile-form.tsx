"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProfileSchema, type UpdateProfileFormData } from "@/lib/validations/settings";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { Spinner } from "../ui/spinner";

export function ProfileForm() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: session?.user?.name || "",
      email: session?.user?.email || "",
    },
  });

  // Mettre à jour les valeurs quand la session est chargée
  useEffect(() => {
    if (session?.user) {
      setValue("name", session.user.name);
      setValue("email", session.user.email);
    }
  }, [session, setValue]);

  const onSubmit = async (data: UpdateProfileFormData) => {
    setIsLoading(true);

    try {
      const emailChanged = data.email !== session?.user?.email;
      const nameChanged = data.name !== session?.user?.name;

      // Mettre à jour le nom si changé
      if (nameChanged) {
        const { error } = await authClient.updateUser({
          name: data.name,
        });

        if (error) {
          toast.error(error.message || "Erreur lors de la mise à jour du nom");
          setIsLoading(false);
          return;
        }
      }

      // Changer l'email si modifié (avec vérification automatique)
      if (emailChanged) {
        const { error } = await authClient.changeEmail({
          newEmail: data.email,
          callbackURL: "/settings",
        });

        if (error) {
          toast.error(error.message || "Erreur lors du changement d'email");
          setIsLoading(false);
          return;
        }
        toast.success("Email de vérification envoyé à votre adresse actuelle ! Vérifiez votre boîte mail pour confirmer le changement.");
      } else if (nameChanged) {
        toast.success("Profil mis à jour avec succès !");
      }

      // Rafraîchir la session
      router.refresh();

      // Si seulement le nom a changé, reload pour mettre à jour partout
      if (nameChanged && !emailChanged) {
        setTimeout(() => {
          window.location.href = '/settings';
        }, 500);
      }
    } catch (error) {
      toast.error("Une erreur s'est produite");
      setIsLoading(false);
    } finally {
      if (!session) {
        setIsLoading(false);
      }
    }
  };

  if (!session) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Profil</h3>
        <p className="text-sm text-muted-foreground">
          Modifiez vos informations personnelles
        </p>
      </div>

      <Separator />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field data-invalid={!!errors.name}>
          <FieldLabel>
            Nom <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            type="text"
            placeholder="Votre nom"
            disabled={isLoading}
            {...register("name")}
          />
          {errors.name && <FieldError>{errors.name.message}</FieldError>}
        </Field>

        <Field data-invalid={!!errors.email}>
          <FieldLabel>
            Email <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            type="email"
            placeholder="votre@email.com"
            disabled={isLoading}
            {...register("email")}
          />
          <FieldDescription>
            Un email de vérification sera envoyé à la nouvelle adresse
          </FieldDescription>
          {errors.email && <FieldError>{errors.email.message}</FieldError>}
        </Field>

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner />
                Enregistrement...
              </>
            ) : "Enregistrer les modifications"}
          </Button>
        </div>
      </form>
    </div>
  );
}
