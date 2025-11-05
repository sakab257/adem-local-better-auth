/**
 * Parsers pour fichiers CSV, XLSX, TXT
 * Utilisé pour l'import de la whitelist d'emails
 */

import Papa from "papaparse";
import * as XLSX from "xlsx";

export interface ParsedEmail {
  email: string;
  valid: boolean;
  error?: string;
}

export interface ParseResult {
  emails: ParsedEmail[];
  validCount: number;
  invalidCount: number;
}

/**
 * Valider un email avec une regex simple
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Nettoyer et valider un email
 */
function processEmail(rawEmail: string): ParsedEmail {
  const email = rawEmail.trim().toLowerCase();

  if (!email) {
    return {
      email: rawEmail,
      valid: false,
      error: "Email vide",
    };
  }

  if (!isValidEmail(email)) {
    return {
      email: rawEmail,
      valid: false,
      error: "Format email invalide",
    };
  }

  return {
    email,
    valid: true,
  };
}

/**
 * Parser pour fichiers CSV
 * Format attendu : une colonne "email" ou juste des emails ligne par ligne
 */
export function parseCSV(fileContent: string): ParseResult {
  const parsed = Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
  });

  const emails: ParsedEmail[] = [];

  // Vérifier si on a une colonne "email"
  const hasEmailColumn = parsed.meta.fields?.includes("email");

  if (hasEmailColumn) {
    // Format avec header "email"
    parsed.data.forEach((row: any) => {
      if (row.email) {
        emails.push(processEmail(row.email));
      }
    });
  } else {
    // Format simple : chaque ligne = un email
    const lines = fileContent.split(/\r?\n/).filter((line) => line.trim());
    lines.forEach((line) => {
      emails.push(processEmail(line));
    });
  }

  const validCount = emails.filter((e) => e.valid).length;
  const invalidCount = emails.filter((e) => !e.valid).length;

  return {
    emails,
    validCount,
    invalidCount,
  };
}

/**
 * Parser pour fichiers XLSX/XLS
 * Format attendu : première colonne = emails
 */
export function parseXLSX(fileBuffer: ArrayBuffer): ParseResult {
  const workbook = XLSX.read(fileBuffer, { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

  const emails: ParsedEmail[] = [];

  // Parcourir les lignes (skip header si présent)
  data.forEach((row: any, index) => {
    if (Array.isArray(row) && row.length > 0) {
      const firstCell = row[0];
      if (firstCell && typeof firstCell === "string") {
        // Skip la première ligne si elle contient "email" ou "Email"
        if (index === 0 && firstCell.toLowerCase().includes("email")) {
          return;
        }
        emails.push(processEmail(firstCell));
      }
    }
  });

  const validCount = emails.filter((e) => e.valid).length;
  const invalidCount = emails.filter((e) => !e.valid).length;

  return {
    emails,
    validCount,
    invalidCount,
  };
}

/**
 * Parser pour fichiers TXT
 * Format attendu : un email par ligne
 */
export function parseTXT(fileContent: string): ParseResult {
  const lines = fileContent.split(/\r?\n/).filter((line) => line.trim());
  const emails: ParsedEmail[] = lines.map((line) => processEmail(line));

  const validCount = emails.filter((e) => e.valid).length;
  const invalidCount = emails.filter((e) => !e.valid).length;

  return {
    emails,
    validCount,
    invalidCount,
  };
}

/**
 * Parser universel qui détecte le type de fichier
 */
export function parseFile(
  file: File
): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const extension = file.name.split(".").pop()?.toLowerCase();

    if (extension === "csv") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(parseCSV(content));
      };
      reader.onerror = () => reject(new Error("Erreur lecture fichier CSV"));
      reader.readAsText(file);
    } else if (extension === "xlsx" || extension === "xls") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const buffer = e.target?.result as ArrayBuffer;
        resolve(parseXLSX(buffer));
      };
      reader.onerror = () => reject(new Error("Erreur lecture fichier XLSX"));
      reader.readAsArrayBuffer(file);
    } else if (extension === "txt") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(parseTXT(content));
      };
      reader.onerror = () => reject(new Error("Erreur lecture fichier TXT"));
      reader.readAsText(file);
    } else {
      reject(new Error("Format de fichier non supporté. Utilisez CSV, XLSX ou TXT."));
    }
  });
}
