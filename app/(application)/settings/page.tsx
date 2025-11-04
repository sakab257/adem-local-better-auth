import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { ProfileForm } from "@/components/settings/profile-form";
import { SecurityForm } from "@/components/settings/security-form";
import { AccountForm } from "@/components/settings/account-form";

export const metadata = {
  title: "Paramètres - ADEM",
  description: "Gérez vos paramètres de compte",
};

export default function SettingsPage() {
  return (
    <div className="container max-w-4xl py-10 px-4 mx-auto">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Paramètres</h1>
          <p className="text-muted-foreground">
            Gérez vos informations personnelles et vos préférences
          </p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="security">Sécurité</TabsTrigger>
            <TabsTrigger value="account">Compte</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <Card className="p-6">
              <ProfileForm />
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-6">
            <Card className="p-6">
              <SecurityForm />
            </Card>
          </TabsContent>

          <TabsContent value="account" className="mt-6">
            <Card className="p-6">
              <AccountForm />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
