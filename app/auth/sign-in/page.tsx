import { SignInForm } from "@/components/auth/sign-in-form";
import { Spinner } from "@/components/ui/spinner";
import { Suspense } from "react";

export const metadata = {
  title: "Connexion - ADEM",
  description: "Connectez-vous, ou si vous n'avez pas de compte : inscrivez-vous !",
};


export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Suspense fallback={<div className="flex gap-1 items-center"> <Spinner /> Chargment...</div>}>
        <SignInForm />
      </Suspense>
    </div>
  );
}