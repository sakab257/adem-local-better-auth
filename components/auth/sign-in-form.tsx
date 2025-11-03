"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInSchema, type SignInFormData } from "@/lib/validations/auth";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";

export function SignInForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInFormData) => {
    setIsLoading(true);

    try {
      // Utiliser authClient pour mettre à jour le cache client automatiquement
      await authClient.signIn.email({
        email: data.email,
        password: data.password,
        fetchOptions: {
          onSuccess: () => {
            toast.success("Connexion réussie !");
            router.push("/");
            router.refresh();
          },
          onError: (ctx) => {
            if (ctx.error.status === 403) {
              toast.error("Email non verifiée");
            }
            else{
              toast.error("Email ou mot de passe incorrect");
            }
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
        <CardTitle>Connexion</CardTitle>
        <CardDescription>
          Connectez-vous à votre compte pour suivre vos entraînements
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
              autoComplete="current-password"
              disabled={isLoading}
              {...register("password")}
            />
            {errors.password && <FieldError>{errors.password.message}</FieldError>}
          </Field>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-1">
                <Spinner />
                Connexion...
              </span>
              
            ) : "Se connecter"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2 text-sm text-muted-foreground">
        <Link
          href="/auth/forgot-password"
          className="hover:text-foreground underline underline-offset-4"
        >
          Mot de passe oublié ?
        </Link>
        <div>
          Pas encore de compte ?{" "}
          <Link
            href="/auth/sign-up"
            className="font-medium text-foreground hover:underline underline-offset-4"
          >
            S'inscrire
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
