import { verifySession } from "@/lib/dal";
import { requirePermission } from "@/lib/rbac";
import {
  listAuditLogs,
  getAvailableActions,
  getAvailableResources,
} from "@/server/audit";
import { AuditLogsTable } from "@/components/logs/audit-logs-table";
import { LogsFilters } from "@/components/logs/logs-filters";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { AuditAction, AuditResource } from "@/lib/audit";

export const metadata = {
  title: "Logs d'Audit - ADEM",
  description: "Consulter les logs d'audit de l'association",
};

interface PageProps {
  searchParams: Promise<{
    action?: AuditAction;
    resource?: AuditResource;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
    limit?: string;
  }>;
}

export default async function LogsPage({ searchParams }: PageProps) {
  // Vérifier la permission logs:read
  const session = await verifySession();
  await requirePermission(session.user.id, "logs:read");

  // Récupérer les searchParams
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const limit = parseInt(params.limit || "20", 10);

  // Construire les filtres
  const filters = {
    action: params.action,
    resource: params.resource,
    userId: params.userId,
    dateFrom: params.dateFrom ? new Date(params.dateFrom) : undefined,
    dateTo: params.dateTo ? new Date(params.dateTo) : undefined,
    page,
    limit,
  };

  // Récupérer les logs et les données pour les filtres
  const [logsResult, actionsResult, resourcesResult] = await Promise.all([
    listAuditLogs(filters),
    getAvailableActions(),
    getAvailableResources(),
  ]);

  // Gérer les erreurs
  if (!logsResult.success || !actionsResult.success || !resourcesResult.success) {
    const errorMessage =
      logsResult.error ||
      actionsResult.error ||
      resourcesResult.error ||
      "Erreur lors du chargement des logs";

    return (
      <div className="container max-w-7xl py-10 px-4 mx-auto">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Logs d'Audit</h1>
            <p className="text-muted-foreground">
              Consultez toutes les actions effectuées sur la plateforme
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

  const { logs, total, totalPages } = logsResult.data!;
  const availableActions = actionsResult.data!;
  const availableResources = resourcesResult.data!;

  return (
    <div className="container max-w-7xl py-10 px-4 mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Logs d'Audit</h1>
          <p className="text-muted-foreground">
            Consultez toutes les actions effectuées sur la plateforme ({total} entrées)
          </p>
        </div>

        {/* Filtres */}
        <LogsFilters
          availableActions={availableActions}
          availableResources={availableResources}
          currentFilters={params}
        />

        {/* Tableau des logs */}
        {logs.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Aucun log trouvé</AlertTitle>
            <AlertDescription>
              Aucun log d'audit ne correspond aux critères de recherche.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <AuditLogsTable logs={logs} />

            {/* Pagination */}
            {totalPages > 1 && (
              <PaginationControls
                currentPage={page}
                totalPages={totalPages}
                totalItems={total}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
