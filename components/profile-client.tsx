"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { Separator } from "./ui/separator";
import { toast } from "sonner";
import { LogOut, Mail, User } from "lucide-react";

export default function ProfileClient() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
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

  // État de chargement avec skeleton
  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-48 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // État non connecté (ne devrait pas arriver grâce au proxy)
  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Non connecté</CardTitle>
            <CardDescription>
              Vous devez être connecté pour accéder à cette page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/auth/sign-in")} className="w-full">
              Se connecter
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }


  // Composant principal avec profil
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/40">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Mon Profil</CardTitle>
          <CardDescription>
            Bienvenue sur votre espace Fitness Tracker
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar et nom */}
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{session.user.name}</h3>
              <p className="text-sm text-muted-foreground">Membre actif</p>
            </div>
          </div>

          <Separator />

          {/* Informations utilisateur */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">Email</p>
                <p className="font-medium">{session.user.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">Nom</p>
                <p className="font-medium">{session.user.name}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-2">
            <Button
              onClick={handleSignOut}
              variant="destructive"
              className="w-full"
              disabled={isSigningOut}
            >
              {isSigningOut ? (
                "Déconnexion..."
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Se déconnecter
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}