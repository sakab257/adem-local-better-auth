import { verifySession } from "@/lib/dal";
import { isAdmin, isModerator, requireAllPermissions } from "@/lib/rbac";
import { getRoleById, getRoleMembers, getAllPermissions, countRoleMembers } from "@/server/roles";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { RoleGeneralTab } from "@/components/roles/role-general-tab";
import { RolePermissionsTab } from "@/components/roles/role-permissions-tab";
import { RoleMembersTab } from "@/components/roles/role-members-tab";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RolePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function RolePage({ params }: RolePageProps) {
  const { id: roleId } = await params;

  // Vérifier la session et les permissions
  const session = await verifySession();
  await requireAllPermissions(session.user.id, ["roles:read","roles:update"]);

  // Récupérer le rôle avec ses permissions
  const roleResult = await getRoleById(roleId);
  if (!roleResult.success) {
    return (
      <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto w-full">
        <Alert variant="destructive">
          <AlertDescription>{roleResult.error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const roleWithPermissions = roleResult.data;
  if (!roleWithPermissions) {
    return (
      <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto w-full">
        <Alert variant="destructive">
          <AlertDescription>Role sans permission(s) trouvé ! Veuillez réessayer !</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Récupérer les membres du rôle
  const membersResult = await getRoleMembers(roleId);
  if (!membersResult.success) {
    return (
      <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto w-full">
        <Alert variant="destructive">
          <AlertDescription>{membersResult.error}</AlertDescription>
        </Alert>
      </div>
    );
  }
  const members = membersResult.data!;

  // Récupérer toutes les permissions disponibles
  const allPermissionsResult = await getAllPermissions();
  if (!allPermissionsResult.success) {
    return (
      <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto w-full">
        <Alert variant="destructive">
          <AlertDescription>{allPermissionsResult.error}</AlertDescription>
        </Alert>
      </div>
    );
  }
  const allPermissions = allPermissionsResult.data!;

  // Compter les membres
  const memberCountResult = await countRoleMembers(roleId);
  if (!memberCountResult.success) {
    return (
      <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto w-full">
        <Alert variant="destructive">
          <AlertDescription>{memberCountResult.error}</AlertDescription>
        </Alert>
      </div>
    );
  }
  const memberCount = memberCountResult.data!;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto w-full">
      {/* Bouton retour */}
      <div>
        <Link href="/roles">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Retour aux rôles
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div
          className="w-2 h-16 rounded-full"
          style={{ backgroundColor: roleWithPermissions.color || "#6366f1" }}
        />
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{roleWithPermissions.name}</h1>
          {roleWithPermissions.description && (
            <p className="text-muted-foreground mt-1">{roleWithPermissions.description}</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="permissions">
            Permissions ({roleWithPermissions.permissions.length})
          </TabsTrigger>
          <TabsTrigger value="members">Membres ({memberCount})</TabsTrigger>
        </TabsList>

        {/* Tab Général */}
        <TabsContent value="general">
          <Card>
            <CardContent className="pt-6">
              <RoleGeneralTab role={roleWithPermissions} memberCount={memberCount} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Permissions */}
        <TabsContent value="permissions">
          <Card>
            <CardContent className="pt-6">
              <RolePermissionsTab
                roleId={roleId}
                allPermissions={allPermissions}
                currentPermissions={roleWithPermissions.permissions}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Membres */}
        <TabsContent value="members">
          <Card>
            <CardContent className="pt-6">
              <RoleMembersTab roleId={roleId} members={members} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
