import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { verifySession } from "@/lib/dal";
import { redirect } from "next/navigation";
import { db } from "@/db/drizzle";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import SignOutButton from "@/components/auth/sign-out-button";

export const metadata = {
  title: "En attente de validation - ADEM",
  description: "Votre compte est en attente de validation par un administrateur",
};

export default async function PendingPage() {
  // Vérifier la session
  const session = await verifySession();

  // Vérifier le statut actuel de l'utilisateur
  const userRecord = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
  });

  // Si le statut n'est plus 'pending', rediriger vers le dashboard
  if (userRecord?.status !== "pending") {
    redirect("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center mb-4">
            <Clock className="h-6 w-6 text-warning" />
          </div>
          <CardTitle className="text-2xl">Compte en attente de validation</CardTitle>
          <CardDescription className="text-base">
            Votre inscription a bien été prise en compte
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-4 text-sm text-muted-foreground">
            <p className="text-center">
              Bonjour <span className="font-semibold text-foreground capitalize">{session.user.name}</span>
            </p>

            <p>
              Votre compte est actuellement <span className="font-semibold text-warning">en attente de validation</span> par
              un responsable de l'ADEM.
            </p>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="font-medium text-foreground">Prochaines étapes :</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Un responsable examinera votre demande sous 24 à 48 heures</li>
                <li>Vous pourrez alors accéder à toutes les fonctionnalités</li>
              </ul>
            </div>

            <p className="text-xs text-center">
              Si vous avez des questions, contactez-nous à{" "}
              <span className="font-bold hover:underline">
                respo.adem@gmail.fr
              </span>
            </p>
          </div>

          <div className="pt-4 flex justify-center">
            <SignOutButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
