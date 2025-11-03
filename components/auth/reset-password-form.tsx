"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/lib/validations/settings";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Récupérer le token depuis l'URL
    const tokenFromUrl = searchParams.get("token");
    if (!tokenFromUrl) {
      toast.error("Token manquant ou invalide");
    }
    setToken(tokenFromUrl);
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      toast.error("Token manquant");
      return;
    }

    setIsLoading(true);

    try {
      // ✅ Appel à BetterAuth pour reset password
      const result = await authClient.resetPassword({
        newPassword: data.password,
        token,
      });

      if (result.error) {
        toast.error(result.error.message || "Erreur lors de la réinitialisation");
        setIsLoading(false);
      } else {
        setResetSuccess(true);
        toast.success("Mot de passe réinitialisé avec succès !");
        setTimeout(() => {
          router.push("/auth/sign-in");
        }, 3000);
      }
    } catch (error) {
      toast.error("Une erreur s'est produite");
      setIsLoading(false);
    }
  };

  // Écran de succès
  if (resetSuccess) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle>Mot de passe réinitialisé !</CardTitle>
          <CardDescription>
            Votre mot de passe a été réinitialisé avec succès
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Redirection vers la page de connexion...
          </p>
          <Link href="/auth/sign-in">
            <Button className="w-full">
              Se connecter maintenant
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Formulaire de reset
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Nouveau mot de passe</CardTitle>
        <CardDescription>
          Choisissez un nouveau mot de passe sécurisé
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field data-invalid={!!errors.password}>
            <FieldLabel>
              Nouveau mot de passe <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={isLoading || !token}
              {...register("password")}
            />
            {errors.password && <FieldError>{errors.password.message}</FieldError>}
          </Field>

          <Field data-invalid={!!errors.confirmPassword}>
            <FieldLabel>
              Confirmer le mot de passe <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={isLoading || !token}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <FieldError>{errors.confirmPassword.message}</FieldError>
            )}
          </Field>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !token}
          >
            {isLoading ? (
              <>
                <Spinner />
                Réinitialisation...
              </>
            ) : "Réinitialiser le mot de passe"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
