import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import crypto from "crypto"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Génère un mot de passe temporaire sécurisé
 *
 * Format : 16 caractères avec majuscules, minuscules, chiffres et symboles
 * Utilise crypto.randomBytes pour une génération cryptographiquement sûre
 *
 * @returns Un mot de passe temporaire sécurisé
 */
export function generateSecurePassword(): string {
  const length = 16;
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*";

  const allChars = uppercase + lowercase + numbers + symbols;

  // Générer des bytes aléatoires cryptographiquement sûrs
  const randomBytes = crypto.randomBytes(length);

  let password = "";

  // Assurer au moins 1 caractère de chaque type
  password += uppercase[randomBytes[0] % uppercase.length];
  password += lowercase[randomBytes[1] % lowercase.length];
  password += numbers[randomBytes[2] % numbers.length];
  password += symbols[randomBytes[3] % symbols.length];

  // Compléter avec des caractères aléatoires
  for (let i = 4; i < length; i++) {
    password += allChars[randomBytes[i] % allChars.length];
  }

  // Mélanger les caractères pour éviter un pattern prévisible
  return password
    .split("")
    .sort(() => crypto.randomBytes(1)[0] - 128)
    .join("");
}
