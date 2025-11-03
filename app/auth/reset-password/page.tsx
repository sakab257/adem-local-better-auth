import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Spinner } from "@/components/ui/spinner";
import { Suspense } from "react";

export const metadata = {
  title: "Réinitialiser le mot de passe - Sanity",
  description: "Réinitialisez votre mot de passe",
};

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Suspense fallback={<div className="flex gap-1 items-center"> <Spinner /> Chargment...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
