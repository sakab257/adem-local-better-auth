"use client";

import { UserWithRoles } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";
import { banUser } from "@/server/members";

interface BanUserDialogProps {
  user: UserWithRoles;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// Raisons prédéfinies pour le bannissement
const BAN_REASONS = [
  { value: "spam", label: "Spam / Contenu inapproprié" },
  { value: "harassment", label: "Harcèlement" },
  { value: "violation", label: "Violation des règles" },
  { value: "fraud", label: "Fraude / Usurpation d'identité" },
  { value: "inactivity", label: "Inactivité prolongée" },
  { value: "other", label: "Autre (précisez)" },
];

export function BanUserDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: BanUserDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [customReason, setCustomReason] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // Validation
    if (!selectedReason) {
      toast.error("Veuillez sélectionner une raison");
      return;
    }

    if (selectedReason === "other" && !customReason.trim()) {
      toast.error("Veuillez préciser la raison");
      return;
    }

    // Construire la raison finale
    const finalReason =
      selectedReason === "other"
        ? customReason
        : BAN_REASONS.find((r) => r.value === selectedReason)?.label || selectedReason;

    setLoading(true);
    const result = await banUser(user.id, finalReason);
    setLoading(false);

    if (result.success) {
      toast.success(`${user.name} a été banni de manière permanente`);
      onSuccess();
      // Reset form
      setSelectedReason("");
      setCustomReason("");
    } else {
      toast.error(result.error || "Erreur lors du bannissement");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bannir un membre</DialogTitle>
          <DialogDescription>
            Bannir <strong>{user.name}</strong> de l'association
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Raison prédéfinie */}
          <div className="space-y-2">
            <Label htmlFor="reason">Raison du bannissement</Label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Sélectionnez une raison" />
              </SelectTrigger>
              <SelectContent>
                {BAN_REASONS.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Raison personnalisée si "Autre" */}
          {selectedReason === "other" && (
            <div className="space-y-2">
              <Label htmlFor="customReason">Précisez la raison</Label>
              <Textarea
                id="customReason"
                placeholder="Décrivez la raison du bannissement..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {/* Information bannissement permanent */}
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
            <p className="text-sm text-destructive font-medium">
              ⚠️ Le bannissement sera permanent
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              L'utilisateur pourra être débanni manuellement plus tard si nécessaire.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Bannissement..." : "Bannir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
