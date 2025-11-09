import { Metadata } from "next";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { requireAllPermissions } from "@/lib/rbac";
import { getManageableRoles } from "@/server/members";
import { AddMemberForm } from "@/components/members/add-member-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Ajouter un membre | ADEM",
  description: "Créer un nouveau membre manuellement",
};

export default async function AddMemberPage() {
  // 1. Vérifier la session
  const session = await verifySession();

  // 2. Vérifier les permissions
  await requireAllPermissions(session.user.id, ["members:invite","members:create",]);

  // 3. Charger les rôles gérables (SSR)
  const rolesResult = await getManageableRoles();

  // Gérer les erreurs de chargement des rôles
  if (!rolesResult.success) {
    return (
      <div className="container max-w-4xl py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {rolesResult.error ||
              "Impossible de charger les rôles disponibles"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8 mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Ajouter un membre</h1>
        <p className="text-muted-foreground mt-2">
          Créez un nouveau membre et envoyez-lui automatiquement un email de
          bienvenue
        </p>
      </div>

      <AddMemberForm availableRoles={rolesResult.data || []} />
    </div>
  );
}
