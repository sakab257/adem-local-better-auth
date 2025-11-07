import { verifySession } from "@/lib/dal";
import { can, isAdmin, isModerator, requirePermission } from "@/lib/rbac";
import { listRoles, countRoleMembers } from "@/server/roles";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, ChevronRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default async function RolesPage() {
  // Vérifier la session et les permissions
  const session = await verifySession();
  await requirePermission(session.user.id, "roles:read");

  // Récupérer tous les rôles (sans Admin)
  const rolesResult = await listRoles();
  if (!rolesResult.success) {
    return (
      <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto pt-10">
        <Alert variant="destructive">
          <AlertDescription>{rolesResult.error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const roles = rolesResult.data!.filter((role) => role.name !== "Admin");

  // Récupérer le nombre de membres pour chaque rôle
  const rolesWithMembersResults = await Promise.all(
    roles.map(async (role) => {
      const memberCountResult = await countRoleMembers(role.id);
      return {
        role,
        memberCount: memberCountResult.success ? memberCountResult.data! : 0
      };
    })
  );

  const rolesWithMembers = rolesWithMembersResults.map(({ role, memberCount }) => ({
    ...role,
    memberCount
  }));

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto pt-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rôles</h1>
          <p className="text-muted-foreground mt-1">
            Gérez les rôles et leurs permissions
          </p>
        </div>

        <Link href="/roles/new">
          <Button>
            <Plus className="h-4 w-4" />
            Créer un rôle
          </Button>
        </Link>
      </div>
      <Separator />
      {/* Liste des rôles */}
      {rolesWithMembers.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">Aucun rôle trouvé</p>
        </Card>
      ) : (
        <Card className="p-2 gap-4">
          {rolesWithMembers.map((role) => (
            <Link
              key={role.id}
              href={`/roles/${role.id}`}
              className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors rounded-lg"
            >
              {/* Carré de couleur */}
              <div
                className="w-10 h-10 rounded shrink-0"
                style={{ backgroundColor: role.color || "#6366f1" }}
              />

              {/* Nom et description */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base">{role.name}</h3>
                {role.description ? (
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {role.description}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {role.memberCount} {role.memberCount === 1 ? "membre" : "membres"}
                  </p>
                )}
              </div>

              {/* Chevron */}
              <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
              
            </Link>
            
          ))}
        </Card>
        
      )}
    </div>
  );
}
