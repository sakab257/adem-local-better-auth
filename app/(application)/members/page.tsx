import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { verifySession } from "@/lib/dal";
import { requireAnyRole, isModerator, can } from "@/lib/rbac";
import { listUsers } from "@/server/members";
import { MembersGrid } from "@/components/members/members-grid";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Gestion des membres - ADEM",
  description: "Gérer les membres de l'association",
};

export default async function MembersPage() {
  // Vérifier les permissions
  const session = await verifySession();
  await can(session.user.id, "members:read");

  // Vérifier si l'utilisateur peut changer les rôles (Admin ou Moderateur)
  const canChangeRoles = await isModerator(session.user.id);

  // Récupérer les membres par statut
  const [activeMembers, pendingMembers, bannedMembers] = await Promise.all([
    listUsers({ status: "active", limit: 50 }),
    listUsers({ status: "pending", limit: 50 }),
    listUsers({ status: "banned", limit: 50 }),
  ]);

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
              Bannis / Expulsés ({bannedMembers.total})
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
