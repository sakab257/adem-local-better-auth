import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { verifySession } from "@/lib/dal";
import { can, requirePermission } from "@/lib/rbac";
import { listUsers, getManageableRoles } from "@/server/members";
import { MembersGrid } from "@/components/members/members-grid";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export const metadata = {
  title: "Gestion des membres - ADEM",
  description: "Gérer les membres de l'association",
};

interface PageProps {
  searchParams: Promise<{
    activeTab?: string;
    page?: string;
    limit?: string;
  }>;
}

export default async function MembersPage({ searchParams }: PageProps) {
  // Vérifier les permissions
  const session = await verifySession();
  await requirePermission(session.user.id, "members:read");

  // Vérifier si l'utilisateur peut changer les rôles
  const canChangeRoles = await can(session.user.id, "members:change_role");

  // Récupérer les searchParams
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const limit = parseInt(params.limit || "20", 10);

  // Récupérer les rôles disponibles (pour le dialog ChangeRole)
  // Chargé côté serveur pour éviter waterfall request
  const availableRolesResult = await getManageableRoles();

  // Récupérer les membres par statut avec pagination
  const [activeMembersResult, pendingMembersResult, bannedMembersResult] = await Promise.all([
    listUsers({ status: "active", page, limit }),
    listUsers({ status: "pending", page, limit }),
    listUsers({ status: "banned", page, limit }),
  ]);

  // Gérer les erreurs
  if (
    !activeMembersResult.success ||
    !pendingMembersResult.success ||
    !bannedMembersResult.success ||
    !availableRolesResult.success
  ) {
    const errorMessage =
      activeMembersResult.error ||
      pendingMembersResult.error ||
      bannedMembersResult.error ||
      availableRolesResult.error ||
      "Erreur lors du chargement des données";

    return (
      <div className="container max-w-4xl py-10 px-4 mx-auto">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Gestion des membres</h1>
            <p className="text-muted-foreground">
              Gérez les membres de l'association ADEM
            </p>
          </div>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const activeMembers = activeMembersResult.data!;
  const pendingMembers = pendingMembersResult.data!;
  const bannedMembers = bannedMembersResult.data!;
  const availableRoles = availableRolesResult.data!;

  return (
    <div className="container max-w-4xl py-10 px-4 mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Gestion des membres</h1>
          <p className="text-muted-foreground">
            Gérez les membres de l'association ADEM
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active">
              Actifs ({activeMembers.total - 1})
            </TabsTrigger>
            <TabsTrigger value="pending">
              En attente ({pendingMembers.total})
            </TabsTrigger>
            <TabsTrigger value="banned">
              Bannis ({bannedMembers.total})
            </TabsTrigger>
          </TabsList>

          {/* Tab Actifs */}
          <TabsContent value="active" className="mt-6">
            <Suspense fallback={<GridSkeleton />}>
              <Card>
                <CardContent>
                  <MembersGrid
                    members={activeMembers.users}
                    status="active"
                    currentUserId={session.user.id}
                    canChangeRoles={canChangeRoles}
                    availableRoles={availableRoles}
                  />
                  <PaginationControls
                    currentPage={page}
                    totalPages={Math.ceil(activeMembers.total / limit)}
                    totalItems={activeMembers.total}
                  />
                </CardContent>
              </Card>
            </Suspense>
          </TabsContent>

          {/* Tab En attente */}
          <TabsContent value="pending" className="mt-6">
            <Suspense fallback={<GridSkeleton />}>
              <Card>
                <CardContent>
                  <MembersGrid
                    members={pendingMembers.users}
                    status="pending"
                    currentUserId={session.user.id}
                    canChangeRoles={canChangeRoles}
                    availableRoles={availableRoles}
                  />
                  <PaginationControls
                    currentPage={page}
                    totalPages={Math.ceil(pendingMembers.total / limit)}
                    totalItems={pendingMembers.total}
                  />
                </CardContent>
              </Card>
            </Suspense>
          </TabsContent>

          {/* Tab Bannis */}
          <TabsContent value="banned" className="mt-6">
            <Suspense fallback={<GridSkeleton />}>
              <Card>
                <CardContent>
                  <MembersGrid
                    members={bannedMembers.users}
                    status="banned"
                    currentUserId={session.user.id}
                    canChangeRoles={canChangeRoles}
                    availableRoles={availableRoles}
                  />
                  <PaginationControls
                    currentPage={page}
                    totalPages={Math.ceil(bannedMembers.total / limit)}
                    totalItems={bannedMembers.total}
                  />
                </CardContent>
              </Card>
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-48 w-full" />
      ))}
    </div>
  );
}
