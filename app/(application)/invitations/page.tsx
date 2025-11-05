import { verifySession } from "@/lib/dal";
import { requireAnyRole } from "@/lib/rbac";
import { listWhitelistEmails } from "@/server/invitations";
import { WhitelistList } from "@/components/invitations/whitelist-list";
import { Button } from "@/components/ui/button";
import { Mail, Upload } from "lucide-react";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Invitations - ADEM",
  description: "Gérer les invitations et la whitelist",
};

export default async function InvitationsPage() {
  // Vérifier les permissions
  const session = await verifySession();
  await requireAnyRole(session.user.id, ["Admin", "Moderateur", "Bureau", "CA"]);

  // Récupérer la whitelist
  const whitelistEmails = await listWhitelistEmails();

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
