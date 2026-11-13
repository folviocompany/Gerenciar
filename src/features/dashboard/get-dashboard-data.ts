import "server-only";

import { addCents, subtractCents, toCents } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import { calendarDateInClinic, monthRangeInClinic } from "@/lib/utils";
import type { AppointmentBoardRow, BusinessSettingsRow, ReturnReminderRow } from "@/types/database";

export type DashboardData = {
  today: string;
  monthLabel: string;
  monthStart: string;
  monthEnd: string;
  settings: BusinessSettingsRow;
  billedTodayCents: bigint;
  billedMonthCents: bigint;
  receivedMonthCents: bigint;
  pendingCents: bigint;
  expensesMonthCents: bigint;
  expensesPaidMonthCents: bigint;
  estimatedResultCents: bigint;
  appointmentsTodayCount: number;
  upcomingAppointments: AppointmentBoardRow[];
  nearbyReturns: ReturnReminderRow[];
};

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();
  const today = calendarDateInClinic();
  const { start, end, label } = monthRangeInClinic();

  const [
    settingsResult,
    receivablesMonthResult,
    paymentsMonthResult,
    expensesMonthResult,
    boardResult,
    returnsResult,
  ] = await Promise.all([
    supabase.from("business_settings").select("*").eq("id", 1).single(),
    supabase
      .from("receivables")
      .select("competence_date, amount_cents, status")
      .gte("competence_date", start)
      .lte("competence_date", end)
      .neq("status", "cancelled"),
    supabase
      .from("payments")
      .select("paid_at, amount_cents")
      .gte("paid_at", start)
      .lte("paid_at", end),
    supabase
      .from("expenses")
      .select("competence_date, paid_at, amount_cents, status")
      .gte("competence_date", start)
      .lte("competence_date", end)
      .neq("status", "cancelled"),
    supabase
      .from("appointment_board")
      .select("*")
      .gte("starts_at", `${today}T00:00:00-03:00`)
      .order("starts_at", { ascending: true })
      .limit(8),
    supabase
      .from("return_reminders")
      .select("*")
      .in("status", ["near", "overdue", "upcoming"])
      .order("suggested_return_on", { ascending: true })
      .limit(5),
  ]);

  if (settingsResult.error || !settingsResult.data) {
    throw new Error("Não foi possível carregar as configurações da clínica.");
  }

  const billedTodayCents = (receivablesMonthResult.data ?? [])
    .filter((row) => row.competence_date === today)
    .reduce((total, row) => addCents(total, row.amount_cents), 0n);

  const billedMonthCents = (receivablesMonthResult.data ?? []).reduce(
    (total, row) => addCents(total, row.amount_cents),
    0n,
  );

  const receivedMonthCents = (paymentsMonthResult.data ?? []).reduce(
    (total, row) => addCents(total, row.amount_cents),
    0n,
  );

  const pendingCents = (receivablesMonthResult.data ?? [])
    .filter((row) => row.status === "pending" || row.status === "partial")
    .reduce((total, row) => addCents(total, row.amount_cents), 0n);

  const expensesMonthCents = (expensesMonthResult.data ?? []).reduce(
    (total, row) => addCents(total, row.amount_cents),
    0n,
  );

  const expensesPaidMonthCents = (expensesMonthResult.data ?? [])
    .filter((row) => row.status === "paid")
    .reduce((total, row) => addCents(total, row.amount_cents), 0n);

  const upcomingAppointments = boardResult.data ?? [];
  const appointmentsTodayCount = upcomingAppointments.filter((row) =>
    row.starts_at.startsWith(today),
  ).length;

  return {
    today,
    monthLabel: label,
    monthStart: start,
    monthEnd: end,
    settings: settingsResult.data,
    billedTodayCents,
    billedMonthCents,
    receivedMonthCents,
    pendingCents,
    expensesMonthCents,
    expensesPaidMonthCents,
    estimatedResultCents: subtractCents(receivedMonthCents, expensesPaidMonthCents),
    appointmentsTodayCount,
    upcomingAppointments,
    nearbyReturns: returnsResult.data ?? [],
  };
}

export function centsOrZero(value: unknown): bigint {
  return toCents(typeof value === "string" || typeof value === "number" ? value : 0);
}
