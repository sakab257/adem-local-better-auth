import { Resend } from "resend";
import { render } from "@react-email/components";
import EmailVerification from "@/emails/email-verification";
import PasswordReset from "@/emails/password-reset";
import { toast } from "sonner";

/**
 * Configuration du service email
 *
 * Pour activer Resend :
 * 1. Créer un compte sur https://resend.com (gratuit)
 * 2. Ajouter RESEND_API_KEY dans .env
 * 3. Mettre USE_REAL_EMAILS=true dans .env
 */

const USE_REAL_EMAILS = process.env.USE_REAL_EMAILS === "true";
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "onboarding@resend.dev";

// Initialiser Resend uniquement si on utilise les vrais emails
const resend = USE_REAL_EMAILS && RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

/**
 * Mock d'envoi d'email (log dans la console)
 * Utile pour le développement sans Resend
 */
async function sendEmailMock(to: string, subject: string, html: string) {
  console.log("\n📧 ========== MOCK EMAIL ==========");
  console.log(`📬 A: ${to}`);
  console.log(`📝 Objet: ${subject}`);

  // Extraire le lien de vérification/reset depuis le HTML
  // Chercher spécifiquement les liens avec verify-email, reset-password, ou token=
  const urlPattern = /href="(https?:\/\/[^"]*(?:verify-email|reset-password|token=)[^"]*)"/;
  const urlMatch = html.match(urlPattern);

  if (urlMatch && urlMatch[1]) {
    console.log(`\n🔗 LIEN À COPIER-COLLER :`);
    console.log(`   ${urlMatch[1]}`);
    console.log(`\n💡 Copiez ce lien et collez-le dans votre navigateur\n`);
  } else {
    // Fallback : chercher n'importe quel lien localhost
    const fallbackMatch = html.match(/href="(https?:\/\/localhost[^"]*)"/);
    if (fallbackMatch && fallbackMatch[1]) {
      console.log(`\n🔗 LIEN À COPIER-COLLER :`);
      console.log(`   ${fallbackMatch[1]}`);
      console.log(`\n💡 Copiez ce lien et collez-le dans votre navigateur\n`);
    }
  }

  console.log(`📄 HTML Preview: ${html.substring(0, 200)}...`);
  console.log("===================================\n");

  return { success: true, mock: true };
}

/**
 * Envoi d'email réel avec Resend
 */
async function sendEmailReal(to: string, subject: string, html: string) {
  if (!resend) {
    throw new Error("Resend n'est pas configuré. Vérifiez RESEND_API_KEY.");
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("Erreur Resend:", error);
      toast.error("Erreur Resend" + error);
      throw new Error(error.message);
    }

    console.log("Email envoyé avec succès:", data);
    toast.success("Email envoyé avec succès" + data);
    return { success: true, data };
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi d'email:", error);
    toast.error("Erreur lors de l'envoi d'email:" + error);
    throw error;
  }
}

/**
 * Service d'envoi d'email (avec toggle)
 * Utilise Resend si USE_REAL_EMAILS=true, sinon mock
 */
async function sendEmail(to: string, subject: string, html: string) {
  if (USE_REAL_EMAILS) {
    return sendEmailReal(to, subject, html);
  } else {
    return sendEmailMock(to, subject, html);
  }
}

/**
 * Envoyer un email de vérification
 */
export async function sendVerificationEmail(
  email: string,
  userName: string,
  verificationUrl: string
) {
  const html = await render(
    EmailVerification({ userName, verificationUrl })
  );

  return sendEmail(
    email,
    "Vérifiez votre adresse email",
    html
  );
}

/**
 * Envoyer un email de réinitialisation de mot de passe
 */
export async function sendPasswordResetEmail(
  email: string,
  userName: string,
  resetUrl: string
) {
  const html = await render(
    PasswordReset({ userName, resetUrl })
  );

  return sendEmail(
    email,
    "Réinitialisez votre mot de passe",
    html
  );
}

/**
 * Helper pour afficher le mode actuel
 */
export function getEmailMode() {
  return USE_REAL_EMAILS ? "REAL (Resend)" : "MOCK (Console)";
}
