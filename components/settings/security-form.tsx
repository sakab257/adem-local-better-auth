"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordSchema, type ChangePasswordFormData } from "@/lib/validations/settings";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";

export function SecurityForm() {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    setIsLoading(true);

    try {
      await authClient.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        revokeOtherSessions: false,
        fetchOptions: {
          onSuccess: () => {
            toast.success("Mot de passe modifié avec succès !");
            reset();
            setIsLoading(false);
          },
          onError: (ctx) => {
            toast.error(ctx.error.message || "Erreur lors du changement de mot de passe");
            setIsLoading(false);
          },
        },
      });
    } catch (error) {
      toast.error("Une erreur s'est produite");
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Sécurité</h3>
        <p className="text-sm text-muted-foreground">
          Modifiez votre mot de passe pour sécuriser votre compte
        </p>
      </div>

      <Separator />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field data-invalid={!!errors.currentPassword}>
          <FieldLabel>
            Mot de passe actuel <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            disabled={isLoading}
            {...register("currentPassword")}
          />
          {errors.currentPassword && <FieldError>{errors.currentPassword.message}</FieldError>}
        </Field>

        <Field data-invalid={!!errors.newPassword}>
          <FieldLabel>
            Nouveau mot de passe <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            disabled={isLoading}
            {...register("newPassword")}
          />
          <FieldDescription>
            Au moins 8 caractères avec une majuscule, une minuscule et un chiffre
          </FieldDescription>
          {errors.newPassword && <FieldError>{errors.newPassword.message}</FieldError>}
        </Field>

        <Field data-invalid={!!errors.confirmPassword}>
          <FieldLabel>
            Confirmer le nouveau mot de passe <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            disabled={isLoading}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && <FieldError>{errors.confirmPassword.message}</FieldError>}
        </Field>

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner />
                Modification...
              </>
            ) : "Changer le mot de passe"}
          </Button>
        </div>
      </form>
    </div>
  );
}
