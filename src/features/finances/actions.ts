"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuthContext } from "@/features/auth/get-auth-context";
import { parseBRLToCents } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import type { ExpenseResponsibility, PaymentMethod } from "@/types/database";
import type { FinancialActionState } from "./types";

const paymentMethods = ["pix", "cash", "debit", "credit", "transfer", "other"] as const;

function amountInCents(value: string) {
  try {
    const cents = parseBRLToCents(value);
    return cents > 0n ? cents.toString() : null;
  } catch {
    return null;
  }
}

const revenueSchema = z.object({
  description: z.string().trim().min(2, "Informe uma descrição."),
  amount: z.string().transform(amountInCents).refine(Boolean, "Informe um valor válido."),
  competenceDate: z.iso.date("Informe uma data válida."),
  clientId: z.string().uuid().optional().or(z.literal("")),
  received: z.enum(["yes", "no"]),
  paymentMethod: z.enum(paymentMethods),
});

const expenseSchema = z.object({
  description: z.string().trim().min(2, "Informe uma descrição."),
  categoryId: z.string().uuid("Selecione uma categoria."),
  amount: z.string().transform(amountInCents).refine(Boolean, "Informe um valor válido."),
  competenceDate: z.iso.date("Informe uma data válida."),
  responsibility: z.enum(["ester", "izabela", "shared"]),
  paid: z.enum(["yes", "no"]),
  paymentMethod: z.enum(paymentMethods),
});

function errorState(message: string): FinancialActionState {
  return { status: "error", message };
}

export async function createRevenue(
  _previous: FinancialActionState,
  formData: FormData,
): Promise<FinancialActionState> {
  const context = await requireAuthContext();
  const parsed = revenueSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return errorState(parsed.error.issues[0]?.message ?? "Revise os campos da receita.");
  }

  const supabase = await createClient();
  const values = parsed.data;
  const { data: receivable, error } = await supabase
    .from("receivables")
    .insert({
      professional_id: context.professional.id,
      client_id: values.clientId || null,
      service_record_id: null,
      description: values.description,
      competence_date: values.competenceDate,
      amount_cents: values.amount!,
      created_by: context.userId,
    })
    .select("id")
    .single();

  if (error || !receivable) {
    return errorState("Não foi possível salvar a receita.");
  }

  if (values.received === "yes") {
    const { error: paymentError } = await supabase.from("payments").insert({
      receivable_id: receivable.id,
      professional_id: context.professional.id,
      amount_cents: values.amount!,
      paid_at: values.competenceDate,
      method: values.paymentMethod as PaymentMethod,
      notes: null,
      created_by: context.userId,
    });

    if (paymentError) {
      revalidatePath("/financeiro");
      return errorState("A receita foi criada, mas ficou pendente porque o recebimento não pôde ser salvo.");
    }
  }

  revalidatePath("/financeiro");
  return { status: "success", message: "Receita registrada com sucesso." };
}

export async function createExpense(
  _previous: FinancialActionState,
  formData: FormData,
): Promise<FinancialActionState> {
  const context = await requireAuthContext();
  const parsed = expenseSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return errorState(parsed.error.issues[0]?.message ?? "Revise os campos da despesa.");
  }

  const values = parsed.data;
  if (values.responsibility !== "shared" && values.responsibility !== context.professional.slug) {
    return errorState("Você só pode lançar despesas próprias ou compartilhadas.");
  }

  const paid = values.paid === "yes";
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").insert({
    description: values.description,
    category_id: values.categoryId,
    amount_cents: values.amount!,
    competence_date: values.competenceDate,
    due_date: values.competenceDate,
    paid_at: paid ? values.competenceDate : null,
    responsibility: values.responsibility as ExpenseResponsibility,
    payment_method: paid ? (values.paymentMethod as PaymentMethod) : null,
    status: paid ? "paid" : "pending",
    recurrence: "none",
    recurrence_group_id: null,
    notes: null,
    created_by: context.userId,
  });

  if (error) {
    return errorState("Não foi possível salvar a despesa.");
  }

  revalidatePath("/financeiro");
  return { status: "success", message: "Despesa registrada com sucesso." };
}
