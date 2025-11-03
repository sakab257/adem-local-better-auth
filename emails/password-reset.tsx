import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface PasswordResetProps {
  userName: string;
  resetUrl: string;
}

export default function PasswordReset({
  userName = "Utilisateur",
  resetUrl = "https://example.com/reset-password",
}: PasswordResetProps) {
  return (
    <Html>
      <Head />
      <Preview>Réinitialisez votre mot de passe</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Réinitialisation du mot de passe</Heading>
          <Text style={text}>Bonjour {userName},</Text>
          <Text style={text}>
            Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le
            bouton ci-dessous pour continuer.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={resetUrl}>
              Réinitialiser mon mot de passe
            </Button>
          </Section>
          <Text style={text}>
            Ce lien expirera dans <strong>15 minutes</strong>.
          </Text>
          <Text style={footer}>
            Si vous n'avez pas fait cette demande, vous pouvez ignorer cet email
            en toute sécurité.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Styles (identiques à email-verification)
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "560px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0",
  textAlign: "center" as const,
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "16px 24px",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#000",
  borderRadius: "5px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};

const footer = {
  color: "#8898aa",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "16px 24px",
};
