"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const SignOutButton = () => {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      // Utiliser authClient.signOut() pour invalider le cache client ET serveur
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            toast.success("Déconnexion réussie");
            // Redirection vers sign-in
            router.push("/auth/sign-in");
            router.refresh();
          },
          onError: () => {
            toast.error("Erreur lors de la déconnexion");
            setIsSigningOut(false);
          },
        },
      });
    } catch (error) {
      toast.error("Une erreur s'est produite");
      setIsSigningOut(false);
    }
  };

  return (
    <Button
      onClick={handleSignOut}
      variant="destructive"
      className="w-full"
      disabled={isSigningOut}
    >
      {isSigningOut ? (
        <>
          <Spinner />
          Déconnexion...
        </>
      ) : (
        <>
          <LogOut className="mr-2 h-4 w-4" />
          Se déconnecter
        </>
      )}
    </Button>
  )
}

export default SignOutButton