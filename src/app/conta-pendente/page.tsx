import { SignOutButton } from "@/components/layout/sign-out-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/features/auth/get-auth-context";

export const instant = false;

export default async function PendingAccountPage() {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Conta ainda não vinculada</CardTitle>
          <CardDescription>
            O login {user.email} existe no Auth, mas não há perfil de profissional associado.
            Peça para um administrador executar o SQL de vinculação documentado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignOutButton />
        </CardContent>
      </Card>
    </div>
  );
}
