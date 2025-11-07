import { verifySession } from "@/lib/dal";
import { can, isAdmin, isModerator, requireAllPermissions, requirePermission } from "@/lib/rbac";
import { getAllPermissions } from "@/server/roles";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { CreateRoleForm } from "@/components/roles/create-role-form";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default async function NewRolePage() {
  // Vérifier la session et les permissions
  const session = await verifySession();
  await requireAllPermissions(session.user.id, ["roles:create","roles:read"]);

  // Récupérer toutes les permissions disponibles
  const permissionsResult = await getAllPermissions();
  if (!permissionsResult.success) {
    return (
      <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto w-full">
        <Alert variant="destructive">
          <AlertDescription>{permissionsResult.error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const permissions = permissionsResult.data!;

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
      <div>
        <h1 className="text-3xl font-bold">Créer un nouveau rôle</h1>
        <p className="text-muted-foreground mt-1">
          Définissez les propriétés et permissions du nouveau rôle
        </p>
      </div>

      {/* Formulaire */}
      <CreateRoleForm permissions={permissions} />
    </div>
  );
}
