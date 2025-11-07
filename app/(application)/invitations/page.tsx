import { verifySession } from "@/lib/dal";
import { requireAllPermissions} from "@/lib/rbac";
import { listWhitelistEmails } from "@/server/invitations";
import { WhitelistList } from "@/components/invitations/whitelist-list";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export const metadata = {
  title: "Invitations - ADEM",
  description: "Gérer les invitations et la whitelist",
};

// ============================================
// FICHIER REFACTORISE AVEC requirePermission / requireAllPermissions
// ============================================

export default async function InvitationsPage() {
  // Vérifier les permissions
  const session = await verifySession();
  await requireAllPermissions(session.user.id, ["members:invite","members:read"])

  // Récupérer la whitelist
  const whitelistResult = await listWhitelistEmails();

  // Gérer les erreurs
  if (!whitelistResult.success) {
    return (
      <div className="container max-w-4xl py-10 px-4 mx-auto">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Invitations</h1>
            <p className="text-muted-foreground">
              Gérez la whitelist des emails autorisés
            </p>
          </div>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>
              {whitelistResult.error || "Erreur lors du chargement de la whitelist"}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const whitelistEmails = whitelistResult.data!;

  return (
    <div className="container max-w-4xl py-10 px-4 mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Invitations</h1>
            <p className="text-muted-foreground">
              Gérez la whitelist des emails autorisés
            </p>
          </div>
        </div>

        {/* Liste des emails */}
        <Suspense fallback={<ListSkeleton />}>
          <WhitelistList emails={whitelistEmails} />
        </Suspense>
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
