import "server-only";

import { format, getDaysInMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import type { FinancialDashboardData } from "./types";

const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;

function cents(value: number | string) {
  return Number(value);
}

export async function getFinancialDashboardData(requestedMonth?: string): Promise<FinancialDashboardData> {
  const currentMonth = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Manaus",
    year: "numeric",
    month: "2-digit",
  }).format(new Date());
  const month = requestedMonth && monthPattern.test(requestedMonth) ? requestedMonth : currentMonth;
  const start = `${month}-01`;
  const end = `${month}-${String(getDaysInMonth(parseISO(start))).padStart(2, "0")}`;
  const supabase = await createClient();

  const [receivablesResult, paymentsResult, expensesResult, paidExpensesResult, categoriesResult, clientsResult, professionalsResult] =
    await Promise.all([
      supabase.from("receivables").select("id, professional_id, description, competence_date, amount_cents, status").gte("competence_date", start).lte("competence_date", end).neq("status", "cancelled"),
      supabase.from("payments").select("id, receivable_id, professional_id, amount_cents, paid_at, method").gte("paid_at", start).lte("paid_at", end),
      supabase.from("expenses").select("id, description, competence_date, paid_at, amount_cents, status, responsibility").gte("competence_date", start).lte("competence_date", end).neq("status", "cancelled"),
      supabase.from("expenses").select("id, description, paid_at, amount_cents, status").eq("status", "paid").gte("paid_at", start).lte("paid_at", end),
      supabase.from("expense_categories").select("id, name").eq("is_active", true).order("name"),
      supabase.from("clients").select("id, full_name").eq("is_active", true).order("full_name").limit(250),
      supabase.from("professionals").select("id, short_name, accent_color").eq("is_active", true),
    ]);

  const required = [receivablesResult, paymentsResult, expensesResult, paidExpensesResult];
  if (required.some((result) => result.error)) {
    throw new Error("Não foi possível carregar o financeiro.");
  }

  const receivables = receivablesResult.data ?? [];
  const payments = paymentsResult.data ?? [];
  const expenses = expensesResult.data ?? [];
  const paidExpenses = paidExpensesResult.data ?? [];
  const receivableIds = receivables.map((row) => row.id);
  const allPaymentsForReceivables = receivableIds.length
    ? (await supabase.from("payments").select("receivable_id, amount_cents").in("receivable_id", receivableIds)).data ?? []
    : [];
  const paidByReceivable = new Map<string, number>();
  for (const payment of allPaymentsForReceivables) {
    paidByReceivable.set(payment.receivable_id, (paidByReceivable.get(payment.receivable_id) ?? 0) + cents(payment.amount_cents));
  }

  const billedCents = receivables.reduce((sum, row) => sum + cents(row.amount_cents), 0);
  const receivedCents = payments.reduce((sum, row) => sum + cents(row.amount_cents), 0);
  const pendingCents = receivables.reduce(
    (sum, row) => sum + Math.max(0, cents(row.amount_cents) - (paidByReceivable.get(row.id) ?? 0)),
    0,
  );
  const expensesCents = expenses.reduce((sum, row) => sum + cents(row.amount_cents), 0);
  const paidExpensesCents = paidExpenses.reduce((sum, row) => sum + cents(row.amount_cents), 0);

  const days = Array.from({ length: getDaysInMonth(parseISO(start)) }, (_, index) => {
    const date = `${month}-${String(index + 1).padStart(2, "0")}`;
    return {
      day: String(index + 1).padStart(2, "0"),
      ganhos: payments.filter((row) => row.paid_at === date).reduce((sum, row) => sum + cents(row.amount_cents) / 100, 0),
      gastos: paidExpenses.filter((row) => row.paid_at === date).reduce((sum, row) => sum + cents(row.amount_cents) / 100, 0),
    };
  });

  const professionals = professionalsResult.data ?? [];
  const byProfessional = professionals.map((professional) => ({
    name: professional.short_name,
    color: professional.accent_color,
    value: payments.filter((row) => row.professional_id === professional.id).reduce((sum, row) => sum + cents(row.amount_cents) / 100, 0),
  }));

  const incomeTransactions = receivables.map((row) => ({
    id: row.id,
    date: row.competence_date,
    description: row.description,
    kind: "income" as const,
    status: row.status,
    amountCents: cents(row.amount_cents),
  }));
  const expenseTransactions = expenses.map((row) => ({
    id: row.id,
    date: row.competence_date,
    description: row.description,
    kind: "expense" as const,
    status: row.status,
    amountCents: cents(row.amount_cents),
  }));

  return {
    month,
    monthLabel: format(parseISO(start), "MMMM 'de' yyyy", { locale: ptBR }),
    metrics: { billedCents, receivedCents, pendingCents, expensesCents, paidExpensesCents, resultCents: receivedCents - paidExpensesCents },
    daily: days,
    byProfessional,
    transactions: [...incomeTransactions, ...expenseTransactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12),
    categories: (categoriesResult.data ?? []).map((row) => ({ id: row.id, name: row.name })),
    clients: (clientsResult.data ?? []).map((row) => ({ id: row.id, name: row.full_name })),
  };
}
