"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { addEmailsToWhitelist } from "@/server/invitations";
import { Badge } from "@/components/ui/badge";

// ============================================
// FICHIER REFACTORISE
// ============================================

interface AddEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddEmailDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddEmailDialogProps) {
  const [emails, setEmails] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);

  const addEmailField = () => {
    setEmails([...emails, ""]);
  };

  const removeEmailField = (index: number) => {
    setEmails(emails.filter((_, i) => i !== index));
  };

  const updateEmail = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const isValidEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email.trim());
  };

  const handleSubmit = async () => {
    // Filtrer les emails vides
    const filledEmails = emails.filter((e) => e.trim());

    if (filledEmails.length === 0) {
      toast.error("Veuillez saisir au moins un email");
      return;
    }

    // Valider tous les emails
    const invalidEmails = filledEmails.filter((e) => !isValidEmail(e));
    if (invalidEmails.length > 0) {
      toast.error(
        `${invalidEmails.length} email(s) invalide(s) détecté(s)`
      );
      return;
    }

    setLoading(true);
    const result = await addEmailsToWhitelist(filledEmails);
    setLoading(false);

    if (result.success) {
      toast.success(
        `${result.addedCount} email(s) ajouté(s)${
          result.skippedCount ? `, ${result.skippedCount} déjà existant(s)` : ""
        }`
      );
      setEmails([""]);
      onSuccess();
    } else {
      toast.error(result.error || "Erreur lors de l'ajout des emails");
    }
  };

  const handleClose = () => {
    setEmails([""]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajouter des emails manuellement</DialogTitle>
          <DialogDescription>
            Saisissez un ou plusieurs emails à ajouter à la whitelist
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {emails.map((email, index) => (
            <div key={index} className="flex items-end gap-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor={`email-${index}`}>
                  Email {index + 1}
                  {email.trim() && !isValidEmail(email) && (
                    <Badge variant="destructive" className="ml-2 text-xs">
                      Invalide
                    </Badge>
                  )}
                </Label>
                <Input
                  id={`email-${index}`}
                  type="email"
                  placeholder="exemple@email.com"
                  value={email}
                  onChange={(e) => updateEmail(index, e.target.value)}
                  className={
                    email.trim() && !isValidEmail(email)
                      ? "border-destructive"
                      : ""
                  }
                />
              </div>
              {emails.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeEmailField(index)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addEmailField}
            className="w-full gap-2"
          >
            <Plus className="h-4 w-4" />
            Ajouter un email
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Ajout en cours..." : "Valider"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
