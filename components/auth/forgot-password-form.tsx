"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/validations/settings";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);

    try {
      await authClient.forgetPassword({
        email: data.email,
        redirectTo: "/auth/reset-password",
        fetchOptions: {
          onSuccess: () => {
            setEmailSent(true);
            toast.success("Email envoyé avec succès");
            setIsLoading(false);
          },
          onError: (ctx) => {
            toast.error(ctx.error.message || "Erreur lors de l'envoi de l'email");
            setIsLoading(false);
          },
        },
      });
    } catch (error) {
      toast.error("Une erreur s'est produite");
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Email envoyé !</CardTitle>
          <CardDescription>
            Un email de réinitialisation a été envoyé à{" "}
            <span className="font-medium text-foreground">{getValues("email")}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Vérifiez votre boîte mail et suivez les instructions pour réinitialiser
            votre mot de passe.
          </p>
          <p className="text-sm text-muted-foreground text-center">
            Le lien expirera dans <strong>15 minutes</strong>.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/auth/sign-in" className="text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="inline h-4 w-4 mr-1" />
            Retour à la connexion
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Mot de passe oublié ?</CardTitle>
        <CardDescription>
          Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser
          votre mot de passe
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field data-invalid={!!errors.email}>
            <FieldLabel>
              Email <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              type="email"
              placeholder="votre@email.com"
              autoComplete="email"
              disabled={isLoading}
              {...register("email")}
            />
            {errors.email && <FieldError>{errors.email.message}</FieldError>}
          </Field>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Envoi en cours..." : "Envoyer le lien de réinitialisation"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center text-sm text-muted-foreground">
        <Link
          href="/auth/sign-in"
          className="hover:text-foreground flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour à la connexion
        </Link>
      </CardFooter>
    </Card>
  );
}
