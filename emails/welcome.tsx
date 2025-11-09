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

interface WelcomeEmailProps {
  userName: string;
  userEmail: string;
  roleName: string;
  resetPasswordUrl: string;
}

export default function WelcomeEmail({
  userName = "Utilisateur",
  userEmail = "user@example.com",
  roleName = "Membre",
  resetPasswordUrl = "https://example.com/reset-password",
}: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Bienvenue à l'ADEM - Configurez votre compte</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Bienvenue à l'ADEM</Heading>
          <Text style={text}>Bonjour {userName},</Text>
          <Text style={text}>
            Votre compte ADEM a été créé avec succès par un responsable.
          </Text>
          <Section style={infoBox}>
            <Text style={infoText}>
              <strong>Email :</strong> {userEmail}
            </Text>
            <Text style={infoText}>
              <strong>Rôle :</strong> {roleName}
            </Text>
          </Section>
          <Text style={text}>
            Pour activer votre compte et définir votre mot de passe personnel,
            veuillez cliquer sur le bouton ci-dessous :
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={resetPasswordUrl}>
              Définir mon mot de passe
            </Button>
          </Section>
          <Text style={text}>Ou copiez-collez ce lien dans votre navigateur :</Text>
          <Text style={link}>{resetPasswordUrl}</Text>
          <Text style={text}>
            Ce lien expirera dans <strong>24 heures</strong>.
          </Text>
          <Text style={footer}>
            Si vous n'avez pas demandé la création de ce compte, veuillez
            contacter un responsable.
          </Text>
          <Text style={footer}>ADEM</Text>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
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

const infoBox = {
  backgroundColor: "#f6f9fc",
  borderRadius: "5px",
  padding: "16px",
  margin: "24px",
};

const infoText = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "8px 0",
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

const link = {
  color: "#067df7",
  fontSize: "14px",
  textDecoration: "underline",
  margin: "16px 24px",
  wordBreak: "break-all" as const,
};

const footer = {
  color: "#8898aa",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "16px 24px",
};
