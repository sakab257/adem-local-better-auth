"use client";

import { WhitelistEntry } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Upload, Trash2, Search } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { removeEmailFromWhitelist } from "@/server/invitations";
import { AddEmailDialog } from "./add-email-dialog";
import { ImportFileDialog } from "./import-file-dialog";
import { Input } from "@/components/ui/input";
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

interface WhitelistListProps {
  emails: WhitelistEntry[];
}

export function WhitelistList({ emails }: WhitelistListProps) {
  const router = useRouter();
  const [isAddEmailOpen, setIsAddEmailOpen] = useState(false);
  const [isImportFileOpen, setIsImportFileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [emailToDelete, setEmailToDelete] = useState<WhitelistEntry | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Filtrer les emails selon la recherche
  const filteredEmails = emails.filter((e) =>
    e.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (email: WhitelistEntry) => {
    setDeleting(true);
    const result = await removeEmailFromWhitelist(email.id);
    setDeleting(false);
    setEmailToDelete(null);

    if (result.success) {
      toast.success("Email retiré de la whitelist");
      router.refresh();
    } else {
      toast.error(result.error || "Erreur lors de la suppression");
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Liste des emails autorisés</CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={() => setIsAddEmailOpen(true)}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Mail className="h-4 w-4" />
                Saisir Mail
              </Button>
              <Button
                onClick={() => setIsImportFileOpen(true)}
                size="sm"
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Importer Fichier
              </Button>
            </div>
          </div>

          {/* Barre de recherche */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>

        <CardContent>
          {filteredEmails.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>
                {searchQuery
                  ? "Aucun email trouvé"
                  : "Aucun email dans la whitelist"}
              </p>
              {!searchQuery && (
                <p className="text-sm mt-2">
                  Cliquez sur "Saisir Mail" ou "Importer Fichier" pour ajouter
                  des emails
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredEmails.map((email) => (
                <div
                  key={email.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{email.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Ajouté le{" "}
                      {new Date(email.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEmailToDelete(email)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Pagination info */}
          {filteredEmails.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground text-center">
              Affichage de {filteredEmails.length} email(s)
              {searchQuery && ` sur ${emails.length} au total`}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddEmailDialog
        open={isAddEmailOpen}
        onOpenChange={setIsAddEmailOpen}
        onSuccess={() => {
          router.refresh();
          setIsAddEmailOpen(false);
        }}
      />

      <ImportFileDialog
        open={isImportFileOpen}
        onOpenChange={setIsImportFileOpen}
        onSuccess={() => {
          router.refresh();
          setIsImportFileOpen(false);
        }}
      />

      {/* Alert Dialog pour confirmer suppression */}
      <AlertDialog
        open={!!emailToDelete}
        onOpenChange={(open) => !open && setEmailToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir retirer <strong>{emailToDelete?.email}</strong> de
              la whitelist ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => emailToDelete && handleDelete(emailToDelete)}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
