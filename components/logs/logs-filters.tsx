"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { X } from "lucide-react";
import { AuditAction, AuditResource } from "@/lib/audit";

interface LogsFiltersProps {
  availableActions: string[];
  availableResources: string[];
  currentFilters: {
    action?: AuditAction;
    resource?: AuditResource;
    dateFrom?: string;
    dateTo?: string;
  };
}

/**
 * Composant de filtres pour les logs d'audit
 * Permet de filtrer par action, resource, et plage de dates
 */
export function LogsFilters({
  availableActions,
  availableResources,
  currentFilters,
}: LogsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Reset à la page 1 lors d'un changement de filtre
    params.set("page", "1");
    router.push(`/logs?${params.toString()}`);
  };

  const handleClearFilters = () => {
    router.push("/logs");
  };

  const hasActiveFilters =
    currentFilters.action ||
    currentFilters.resource ||
    currentFilters.dateFrom ||
    currentFilters.dateTo;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Filtres</h3>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-8 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Réinitialiser
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Filtre Action */}
            <div className="space-y-2">
              <Label htmlFor="action-filter" className="text-xs">
                Action
              </Label>
              <Select
                value={currentFilters.action || undefined}
                onValueChange={(value) => handleFilterChange("action", value)}
              >
                <SelectTrigger id="action-filter">
                  <SelectValue placeholder="Toutes les actions" />
                </SelectTrigger>
                <SelectContent>
                  {availableActions.map((action) => (
                    <SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtre Resource */}
            <div className="space-y-2">
              <Label htmlFor="resource-filter" className="text-xs">
                Ressource
              </Label>
              <Select
                value={currentFilters.resource || undefined}
                onValueChange={(value) => handleFilterChange("resource", value)}
              >
                <SelectTrigger id="resource-filter">
                  <SelectValue placeholder="Toutes les ressources" />
                </SelectTrigger>
                <SelectContent>
                  {availableResources.map((resource) => (
                    <SelectItem key={resource} value={resource}>
                      {resource}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtre Date Début */}
            <div className="space-y-2">
              <Label htmlFor="date-from-filter" className="text-xs">
                Date de début
              </Label>
              <Input
                id="date-from-filter"
                type="date"
                value={currentFilters.dateFrom || ""}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
              />
            </div>

            {/* Filtre Date Fin */}
            <div className="space-y-2">
              <Label htmlFor="date-to-filter" className="text-xs">
                Date de fin
              </Label>
              <Input
                id="date-to-filter"
                type="date"
                value={currentFilters.dateTo || ""}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
              />
            </div>
          </div>

          {/* Indicateurs de filtres actifs */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-xs text-muted-foreground">Filtres actifs :</span>
              {currentFilters.action && (
                <div className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs">
                  Action: {currentFilters.action}
                  <button
                    onClick={() => handleFilterChange("action", "")}
                    className="hover:bg-secondary-foreground/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              {currentFilters.resource && (
                <div className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs">
                  Ressource: {currentFilters.resource}
                  <button
                    onClick={() => handleFilterChange("resource", "")}
                    className="hover:bg-secondary-foreground/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              {currentFilters.dateFrom && (
                <div className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs">
                  Depuis: {new Date(currentFilters.dateFrom).toLocaleDateString("fr-FR")}
                  <button
                    onClick={() => handleFilterChange("dateFrom", "")}
                    className="hover:bg-secondary-foreground/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              {currentFilters.dateTo && (
                <div className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs">
                  Jusqu'à: {new Date(currentFilters.dateTo).toLocaleDateString("fr-FR")}
                  <button
                    onClick={() => handleFilterChange("dateTo", "")}
                    className="hover:bg-secondary-foreground/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
