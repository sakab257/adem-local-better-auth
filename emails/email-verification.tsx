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

interface EmailVerificationProps {
  userName: string;
  verificationUrl: string;
}

export default function EmailVerification({
  userName = "Utilisateur",
  verificationUrl = "https://example.com/verify",
}: EmailVerificationProps) {
  return (
    <Html>
      <Head />
      <Preview>Vérifiez votre adresse email</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Vérification de votre email</Heading>
          <Text style={text}>Bonjour {userName},</Text>
          <Text style={text}>
            Merci de vous être inscrit ! Veuillez cliquer sur le bouton ci-dessous
            pour vérifier votre adresse email.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={verificationUrl}>
              Vérifier mon email
            </Button>
          </Section>
          <Text style={text}>Ou alors, copiez-collez sur ce lien : </Text>
          <Text style={text}>{verificationUrl}</Text>
          <Text style={text}>
            Ce lien expirera dans <strong>24 heures</strong>.
          </Text>
          <Text style={footer}>
            Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.
          </Text>
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
