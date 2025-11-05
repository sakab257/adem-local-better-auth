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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  Trash2,
  Edit2,
} from "lucide-react";
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { parseFile, ParseResult, ParsedEmail } from "@/lib/parsers";
import { addEmailsToWhitelist } from "@/server/invitations";
import { Input } from "@/components/ui/input";

interface ImportFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ImportFileDialog({
  open,
  onOpenChange,
  onSuccess,
}: ImportFileDialogProps) {
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setFileName(file.name);
    setLoading(true);

    try {
      const result = await parseFile(file);
      setParseResult(result);

      if (result.validCount === 0) {
        toast.error("Aucun email valide trouvé dans le fichier");
      } else {
        toast.success(
          `${result.validCount} email(s) valide(s) détecté(s)`
        );
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la lecture du fichier");
      setParseResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
  });

  const handleRemoveEmail = (index: number) => {
    if (!parseResult) return;

    const newEmails = parseResult.emails.filter((_, i) => i !== index);
    const validCount = newEmails.filter((e) => e.valid).length;
    const invalidCount = newEmails.filter((e) => !e.valid).length;

    setParseResult({
      emails: newEmails,
      validCount,
      invalidCount,
    });
  };

  const handleStartEdit = (index: number, email: string) => {
    setEditingIndex(index);
    setEditValue(email);
  };

  const handleSaveEdit = (index: number) => {
    if (!parseResult) return;

    const newEmails = [...parseResult.emails];
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editValue.trim());

    newEmails[index] = {
      email: editValue.trim().toLowerCase(),
      valid: isValid,
      error: isValid ? undefined : "Format email invalide",
    };

    const validCount = newEmails.filter((e) => e.valid).length;
    const invalidCount = newEmails.filter((e) => !e.valid).length;

    setParseResult({
      emails: newEmails,
      validCount,
      invalidCount,
    });

    setEditingIndex(null);
    setEditValue("");
  };

  const handleSubmit = async () => {
    if (!parseResult || parseResult.validCount === 0) {
      toast.error("Aucun email valide à importer");
      return;
    }

    const validEmails = parseResult.emails
      .filter((e) => e.valid)
      .map((e) => e.email);

    setLoading(true);
    const result = await addEmailsToWhitelist(validEmails);
    setLoading(false);

    if (result.success) {
      toast.success(
        `${result.addedCount} email(s) ajouté(s)${
          result.skippedCount ? `, ${result.skippedCount} déjà existant(s)` : ""
        }`
      );
      handleClose();
      onSuccess();
    } else {
      toast.error(result.error || "Erreur lors de l'import");
    }
  };

  const handleClose = () => {
    setParseResult(null);
    setFileName("");
    setEditingIndex(null);
    setEditValue("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importer un fichier</DialogTitle>
          <DialogDescription>
            Importez des emails depuis un fichier CSV, XLSX ou TXT
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Instructions */}
          {!parseResult && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3">Format attendu :</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div>
                    <strong>CSV :</strong> Une colonne "email" ou un email par
                    ligne
                    <pre className="mt-1 p-2 bg-muted rounded text-xs">
                      email{"\n"}exemple1@email.com{"\n"}exemple2@email.com
                    </pre>
                  </div>
                  <div>
                    <strong>XLSX/XLS :</strong> Première colonne = emails
                  </div>
                  <div>
                    <strong>TXT :</strong> Un email par ligne
                    <pre className="mt-1 p-2 bg-muted rounded text-xs">
                      exemple1@email.com{"\n"}exemple2@email.com
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dropzone */}
          {!parseResult && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              }`}
            >
              <input {...getInputProps()} />
              <Upload
                className={`h-12 w-12 mx-auto mb-4 ${
                  isDragActive ? "text-primary" : "text-muted-foreground"
                }`}
              />
              <p className="text-lg font-medium">
                {isDragActive
                  ? "Déposez le fichier ici"
                  : "Glissez-déposez un fichier ici"}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                ou cliquez pour sélectionner
              </p>
              <p className="text-xs text-muted-foreground mt-4">
                Formats acceptés : CSV, XLSX, XLS, TXT
              </p>
            </div>
          )}

          {/* Loading */}
          {loading && !parseResult && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-sm text-muted-foreground">
                Lecture du fichier en cours...
              </p>
            </div>
          )}

          {/* Aperçu et édition */}
          {parseResult && (
            <div className="space-y-4">
              {/* Stats */}
              <div className="flex items-center gap-4">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">{fileName}</span>
                <Badge variant="outline" className="gap-1">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  {parseResult.validCount} valide(s)
                </Badge>
                {parseResult.invalidCount > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    {parseResult.invalidCount} invalide(s)
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setParseResult(null)}
                  className="ml-auto"
                >
                  Changer de fichier
                </Button>
              </div>

              {/* Liste des emails */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-3">
                    Aperçu ({parseResult.emails.length} emails)
                  </h3>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {parseResult.emails.map((email, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-2 rounded border ${
                          email.valid
                            ? "border-green-200 bg-green-50/50"
                            : "border-destructive bg-destructive/5"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          {editingIndex === index ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="email"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="h-8"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleSaveEdit(index);
                                  } else if (e.key === "Escape") {
                                    setEditingIndex(null);
                                  }
                                }}
                              />
                              <Button
                                size="sm"
                                onClick={() => handleSaveEdit(index)}
                              >
                                OK
                              </Button>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm font-medium truncate">
                                {email.email}
                              </p>
                              {email.error && (
                                <p className="text-xs text-destructive">
                                  {email.error}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {email.valid ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-destructive" />
                          )}
                          {editingIndex !== index && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() =>
                                  handleStartEdit(index, email.email)
                                }
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleRemoveEmail(index)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Annuler
          </Button>
          {parseResult && (
            <Button
              onClick={handleSubmit}
              disabled={loading || parseResult.validCount === 0}
            >
              {loading
                ? "Import en cours..."
                : `Valider (${parseResult.validCount} email(s))`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
