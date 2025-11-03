"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteAccount } from "@/server/settings";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

export function AccountForm() {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);

    try {
      const result = await deleteAccount();

      if (result?.success === false) {
        toast.error(result.error || "Erreur lors de la suppression du compte");
        setIsDeleting(false);
        return;
      }

      toast.success("Compte supprimé avec succès");

      // Redirection vers sign-in après suppression
      router.push("/auth/sign-in");
      router.refresh();
    } catch (error) {
      toast.error("Une erreur s'est produite");
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Compte</h3>
        <p className="text-sm text-muted-foreground">
          Gérez les paramètres de votre compte
        </p>
      </div>

      <Separator />

      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
          <div className="flex-1 space-y-3">
            <div>
              <h4 className="font-medium text-destructive">Zone dangereuse</h4>
              <p className="text-sm text-muted-foreground mt-1">
                La suppression de votre compte est irréversible. Toutes vos données seront
                définitivement supprimées.
              </p>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeleting}>
                  Supprimer mon compte
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. Cela supprimera définitivement votre
                    compte et toutes les données associées de nos serveurs.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {isDeleting ? (
                      <>
                        <Spinner />
                        Suppression...
                      </>
                    ) : "Oui, supprimer mon compte"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}
