import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppHeader } from "@/components/layout/app-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuthContext } from "@/features/auth/get-auth-context";
import { getDashboardData } from "@/features/dashboard/get-dashboard-data";
import { formatBRLFromCents } from "@/lib/money";
import { formatSharePercent } from "@/lib/utils";

function MetricCard({
  label,
  period,
  value,
  hint,
}: {
  label: string;
  period: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{period}</CardDescription>
        <CardTitle className="text-base font-sans font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-display text-3xl">{value}</p>
        {hint ? <p className="mt-2 text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const context = await requireAuthContext();
  const data = await getDashboardData();

  return (
    <div>
      <AppHeader
        professional={context.professional}
        title={`Olá, ${context.professional.short_name}`}
        subtitle={`${data.settings.clinic_name} · valores reais do banco, sem simulação.`}
      />

      <div className="mb-6 rounded-3xl border border-border bg-white/70 p-4 text-sm text-muted-foreground">
        Participação configurada: Ester {formatSharePercent(data.settings.ester_share_bps)} ·
        Izabela {formatSharePercent(data.settings.izabela_share_bps)}. Resultado abaixo é
        gerencial (recebido menos despesas pagas no mês), não lucro contábil.
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Faturamento do dia"
          period={format(parseISO(data.today), "dd 'de' MMMM", { locale: ptBR })}
          value={formatBRLFromCents(data.billedTodayCents)}
          hint="Receitas com data de competência hoje, excluídas as canceladas."
        />
        <MetricCard
          label="Faturamento mensal"
          period={data.monthLabel}
          value={formatBRLFromCents(data.billedMonthCents)}
          hint={`${data.monthStart} a ${data.monthEnd}, regime de competência.`}
        />
        <MetricCard
          label="Valores recebidos"
          period={data.monthLabel}
          value={formatBRLFromCents(data.receivedMonthCents)}
          hint="Soma dos pagamentos com data de recebimento no mês."
        />
        <MetricCard
          label="Títulos em aberto"
          period={data.monthLabel}
          value={formatBRLFromCents(data.pendingCents)}
          hint="Valor original de receitas pendentes ou parciais do mês."
        />
        <MetricCard
          label="Despesas do mês"
          period={data.monthLabel}
          value={formatBRLFromCents(data.expensesMonthCents)}
          hint="Despesas lançadas por competência, ainda que não pagas."
        />
        <MetricCard
          label="Despesas pagas"
          period={data.monthLabel}
          value={formatBRLFromCents(data.expensesPaidMonthCents)}
          hint="Apenas despesas com status pago."
        />
        <MetricCard
          label="Resultado estimado"
          period={`${data.monthLabel} · caixa`}
          value={formatBRLFromCents(data.estimatedResultCents)}
          hint="Recebido no mês menos despesas pagas no mês."
        />
        <MetricCard
          label="Atendimentos no dia"
          period={format(parseISO(data.today), "dd/MM/yyyy")}
          value={String(data.appointmentsTodayCount)}
          hint="Horários do dia visíveis na agenda compartilhada."
        />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Próximos agendamentos</CardTitle>
            <CardDescription>A partir de hoje. Dados pessoais de outra profissional ficam ocultos.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.upcomingAppointments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum horário encontrado. A agenda completa entra na Fase 2.
              </p>
            ) : (
              <ul className="space-y-3">
                {data.upcomingAppointments.map((appointment) => (
                  <li
                    key={appointment.id}
                    className="flex items-center justify-between rounded-2xl bg-muted/60 px-3 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {format(parseISO(appointment.starts_at), "dd/MM HH:mm", { locale: ptBR })}
                      </p>
                      <p className="text-muted-foreground">
                        {appointment.client_id ? "Cliente da sua agenda" : "Agenda compartilhada"}
                      </p>
                    </div>
                    <Badge>{appointment.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Retornos próximos</CardTitle>
            <CardDescription>Clientes com acompanhamento pendente.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.nearbyReturns.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum retorno cadastrado. O módulo completo entra na Fase 5.
              </p>
            ) : (
              <ul className="space-y-3">
                {data.nearbyReturns.map((reminder) => (
                  <li key={reminder.id} className="rounded-2xl bg-muted/60 px-3 py-3 text-sm">
                    Retorno em {format(parseISO(reminder.suggested_return_on), "dd/MM/yyyy")} ·{" "}
                    {reminder.status}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
