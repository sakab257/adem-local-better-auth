import { SignUpForm } from "@/components/auth/sign-up-form";
import { Spinner } from "@/components/ui/spinner";
import { Suspense } from "react";

export const metadata = {
  title: "Inscription - Auth Template",
  description: "Inscrivez-vous, ou si vous avez déjà un compte : connectez-vous !",
};

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Suspense fallback={<div className="flex gap-1 items-center"> <Spinner /> Chargment...</div>}>
        <SignUpForm />
      </Suspense>
    </div>
  );
}