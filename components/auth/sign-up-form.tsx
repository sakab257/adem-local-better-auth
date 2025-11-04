"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpSchema, type SignUpFormData } from "@/lib/validations/auth";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Spinner } from "../ui/spinner";
import { HeartHandshake } from "lucide-react";

export function SignUpForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);

    try {
      // Utiliser authClient pour mettre à jour le cache client automatiquement
      await authClient.signUp.email({
        email: data.email,
        password: data.password,
        name: data.name,
        fetchOptions: {
          onSuccess: () => {
            toast.success("Compte créé avec succès !");
            router.push("/");
            router.refresh();
          },
          onError: (ctx) => {
            toast.error(ctx.error.message || "Impossible de créer le compte. L'email est peut-être déjà utilisé.");
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
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-center gap-2">
          <HeartHandshake />
            As-Salāmu ʿAlaykum 
          <HeartHandshake />
        </CardTitle>
        <CardDescription className="text-center">
          {`Bienvenue sur le site de l'ADEM !`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field data-invalid={!!errors.name}>
            <FieldLabel>
              Nom <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              type="text"
              placeholder="Votre nom"
              autoComplete="name"
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
              placeholder="exemple@email.com"
              autoComplete="email"
              disabled={isLoading}
              {...register("email")}
            />
            {errors.email && <FieldError>{errors.email.message}</FieldError>}
          </Field>

          <Field data-invalid={!!errors.password}>
            <FieldLabel>
              Mot de passe <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={isLoading}
              {...register("password")}
            />
            <FieldDescription>
              Au moins 8 caractères avec une majuscule, une minuscule et un chiffre
            </FieldDescription>
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
              disabled={isLoading}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && <FieldError>{errors.confirmPassword.message}</FieldError>}
          </Field>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner />
                Création...
              </>
            ) : "Créer mon compte"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center text-sm text-muted-foreground">
        <div>
          Déjà un compte ?{" "}
          <Link
            href="/auth/sign-in"
            className="font-medium text-foreground hover:underline underline-offset-4"
          >
            Se connecter
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
