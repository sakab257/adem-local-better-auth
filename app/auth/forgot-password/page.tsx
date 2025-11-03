import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { Spinner } from "@/components/ui/spinner";
import { Suspense } from "react";

export const metadata = {
  title: "Mot de passe oublié - Sanity",
  description: "Réinitialisez votre mot de passe",
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Suspense fallback={<div className="flex gap-1 items-center"> <Spinner /> Chargment...</div>}>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  );
}