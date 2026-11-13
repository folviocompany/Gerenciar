import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuthContext } from "@/features/auth/get-auth-context";

const upcoming = [
  { title: "Procedimentos", phase: "Fase 2" },
  { title: "Retornos", phase: "Fase 5" },
  { title: "Relatórios", phase: "Fase 4" },
  { title: "Despesas", phase: "Fase 3" },
];

export default async function MorePage() {
  const context = await requireAuthContext();

  return (
    <div>
      <AppHeader
        professional={context.professional}
        title="Mais"
        subtitle="Módulos disponíveis e próximas entregas."
      />
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Disponível agora</CardTitle>
            <CardDescription>Fase 1 — fundação</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/configuracoes"
              className="block rounded-2xl bg-accent/50 px-4 py-3 text-sm font-medium"
            >
              Configurações da clínica e do perfil
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Próximas etapas</CardTitle>
            <CardDescription>
              Itens visíveis para planejamento. Ainda não há cadastro operacional nestas telas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcoming.map((item) => (
              <div
                key={item.title}
                className="flex items-center justify-between rounded-2xl bg-muted/70 px-4 py-3 text-sm"
              >
                <span>{item.title}</span>
                <span className="text-muted-foreground">{item.phase}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
