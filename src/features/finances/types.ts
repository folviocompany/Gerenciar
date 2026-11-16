export type FinancialActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export const initialFinancialActionState: FinancialActionState = {
  status: "idle",
  message: "",
};

export type FinancialDashboardData = {
  month: string;
  monthLabel: string;
  metrics: {
    billedCents: number;
    receivedCents: number;
    pendingCents: number;
    expensesCents: number;
    paidExpensesCents: number;
    resultCents: number;
  };
  daily: Array<{ day: string; ganhos: number; gastos: number }>;
  byProfessional: Array<{ name: string; value: number; color: string }>;
  transactions: Array<{
    id: string;
    date: string;
    description: string;
    kind: "income" | "expense";
    status: string;
    amountCents: number;
  }>;
  categories: Array<{ id: string; name: string }>;
  clients: Array<{ id: string; name: string }>;
};
