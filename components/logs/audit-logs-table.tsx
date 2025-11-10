"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { AuditLogEntry } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface AuditLogsTableProps {
  logs: AuditLogEntry[];
}

/**
 * Retourne une couleur de badge selon l'action
 *
 * 📝 POUR AJOUTER UNE NOUVELLE ACTION :
 * Ajouter un case pour définir la couleur du badge selon l'impact de l'action
 *
 * Convention des couleurs :
 * - "default" (bleu) : Création, activation, actions positives
 * - "secondary" (gris) : Modification, assignation, actions neutres
 * - "destructive" (rouge) : Suppression, bannissement, actions critiques
 * - "outline" (bordure) : Actions mineures
 */
function getActionVariant(action: string) {
  switch (action) {
    case "create":
      return "default";
    case "update":
      return "secondary";
    case "delete":
      return "destructive";
    case "ban":
      return "destructive";
    case "unban":
      return "default";
    case "assign":
      return "secondary";
    case "remove":
      return "outline";
    // 📝 Ajouter ici les nouvelles actions si besoin :
    // case "validate":
    //   return "default";
    // case "publish":
    //   return "default";
    // case "reject":
    //   return "destructive";
    default:
      return "outline";
  }
}

/**
 * Retourne une couleur de badge selon la ressource
 *
 * 📝 POUR AJOUTER UNE NOUVELLE RESSOURCE :
 * Ajouter un case pour définir la couleur du badge
 *
 * Couleurs disponibles :
 * - "default" : bleu (users, events)
 * - "secondary" : gris (roles)
 * - "destructive" : rouge (actions critiques)
 * - "outline" : bordure (permissions, feedback)
 */
function getResourceVariant(resource: string) {
  switch (resource) {
    case "user":
    case "member":
      return "default";
    case "role":
      return "secondary";
    case "permission":
      return "outline";
    // 📝 Ajouter ici les nouveaux types de ressources :
    // case "event":
    //   return "default";
    // case "resource":
    // case "task":
    //   return "secondary";
    // case "feedback":
    //   return "outline";
    default:
      return "outline";
  }
}

/**
 * Formatte les métadonnées JSON pour affichage lisible
 */
function formatMetadata(metadata: string | null): string {
  if (!metadata) return "Aucune métadonnée";
  try {
    const parsed = JSON.parse(metadata);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return metadata;
  }
}

/**
 * Composant Dialog pour afficher les détails d'un log
 */
function LogDetailsDialog({ log }: { log: AuditLogEntry }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Détails du log</DialogTitle>
          <DialogDescription>
            Informations détaillées sur l'action effectuée
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm mb-2">Informations générales</h4>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">ID du log :</dt>
                <dd className="font-mono text-xs">{log.id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Date :</dt>
                <dd>{new Date(log.createdAt).toLocaleString("fr-FR")}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Utilisateur :</dt>
                <dd>{log.userName || "Système"} ({log.userEmail || "N/A"})</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Action :</dt>
                <dd>
                  <Badge variant={getActionVariant(log.action)}>{log.action}</Badge>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Ressource :</dt>
                <dd>
                  <Badge variant={getResourceVariant(log.resource)}>{log.resource}</Badge>
                </dd>
              </div>
              {log.resourceId && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">ID de la ressource :</dt>
                  <dd className="font-mono text-xs">{log.resourceId}</dd>
                </div>
              )}
            </dl>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-2">Informations techniques</h4>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Adresse IP :</dt>
                <dd className="font-mono text-xs">{log.ipAddress || "unknown"}</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-muted-foreground">User Agent :</dt>
                <dd className="font-mono text-xs break-all">{log.userAgent || "unknown"}</dd>
              </div>
            </dl>
          </div>

          {log.metadata && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Métadonnées</h4>
              <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                {formatMetadata(log.metadata)}
              </pre>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Tableau des logs d'audit avec colonnes : Date, Utilisateur, Action, Ressource, IP, Détails
 */
export function AuditLogsTable({ logs }: AuditLogsTableProps) {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Utilisateur</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Ressource affectée</TableHead>
            <TableHead className="text-right">Détails</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="text-sm">
                <div className="flex flex-col">
                  <span className="font-medium">
                    {formatDistanceToNow(new Date(log.createdAt), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString("fr-FR")}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-sm">
                <div className="flex flex-col">
                  <span className="font-medium">{log.userName || "Système"}</span>
                  <span className="text-xs text-muted-foreground">
                    {log.userEmail || "N/A"}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={getActionVariant(log.action)}>{log.action}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={getResourceVariant(log.resource)}>{log.resource}</Badge>
                  </div>
                  {log.resourceName ? (
                    <span className="text-sm font-medium">{log.resourceName}</span>
                  ) : log.resourceId ? (
                    <span className="text-xs text-muted-foreground font-mono">
                      {log.resourceId.substring(0, 12)}...
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">Non spécifié</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <LogDetailsDialog log={log} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
