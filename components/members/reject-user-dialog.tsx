"use client";

import { UserWithRoles } from "@/lib/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { rejectUser } from "@/server/members";

interface RejectUserDialogProps {
  user: UserWithRoles;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RejectUserDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: RejectUserDialogProps) {
  const [isRejecting, setIsRejecting] = useState(false);

  const handleReject = async () => {
    setIsRejecting(true);
    const result = await rejectUser(user.id);
    setIsRejecting(false);

    if (result.success) {
      toast.success(`${user.name} a été rejeté`);
      onSuccess();
    } else {
      toast.error(result.error || "Erreur lors du rejet");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Rejeter cette demande ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible. Le compte de <strong>{user.name}</strong>{" "}
            ({user.email}) sera définitivement supprimé et l'utilisateur ne pourra pas
            accéder à l'association.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isRejecting}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReject}
            disabled={isRejecting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isRejecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Oui, rejeter
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
