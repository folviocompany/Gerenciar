import { LoginForm } from "@/features/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-gold">Clínica</p>
        <CardTitle className="text-4xl">Beauty Manager</CardTitle>
        <CardDescription>
          Acesso privado para Ester e Dra. Izabela. Não há cadastro público.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  );
}
