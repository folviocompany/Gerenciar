"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownRight, ArrowUpRight, CircleDollarSign, ReceiptText, WalletCards } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createExpense, createRevenue } from "./actions";
import { initialFinancialActionState, type FinancialDashboardData } from "./types";
import type { ProfessionalSlug } from "@/types/database";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const fieldClass = "h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-gold/50";
const paymentMethods = [
  ["pix", "Pix"], ["cash", "Dinheiro"], ["debit", "Débito"], ["credit", "Crédito"], ["transfer", "Transferência"], ["other", "Outro"],
] as const;

function money(cents: number) {
  return currency.format(cents / 100);
}

function Metric({ label, value, note, tone = "neutral" }: { label: string; value: number; note: string; tone?: "neutral" | "positive" | "negative" }) {
  const Icon = tone === "positive" ? ArrowUpRight : tone === "negative" ? ArrowDownRight : CircleDollarSign;
  return (
    <Card className="overflow-hidden">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-3">
          <div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 font-display text-3xl">{money(value)}</p></div>
          <span className={`rounded-2xl p-2 ${tone === "negative" ? "bg-red-50 text-red-600" : tone === "positive" ? "bg-emerald-50 text-emerald-600" : "bg-muted text-primary"}`}><Icon className="size-5" /></span>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  );
}

function Feedback({ state }: { state: typeof initialFinancialActionState }) {
  if (state.status === "idle") return null;
  return <p aria-live="polite" className={`text-sm ${state.status === "success" ? "text-success" : "text-destructive"}`}>{state.message}</p>;
}

function RevenueForm({ data }: { data: FinancialDashboardData }) {
  const [state, action, pending] = useActionState(createRevenue, initialFinancialActionState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.status === "success") formRef.current?.reset(); }, [state]);
  return (
    <form ref={formRef} action={action} className="space-y-4">
      <div><Label htmlFor="revenue-description">Descrição</Label><Input id="revenue-description" name="description" placeholder="Ex.: Procedimento facial" required /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><Label htmlFor="revenue-amount">Valor</Label><Input id="revenue-amount" name="amount" inputMode="decimal" placeholder="0,00" required /></div>
        <div><Label htmlFor="revenue-date">Data</Label><Input id="revenue-date" name="competenceDate" type="date" defaultValue={`${data.month}-01`} required /></div>
      </div>
      <div><Label htmlFor="revenue-client">Cliente (opcional)</Label><select id="revenue-client" name="clientId" className={fieldClass}><option value="">Sem cliente vinculado</option>{data.clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><Label htmlFor="revenue-received">Situação</Label><select id="revenue-received" name="received" className={fieldClass} defaultValue="yes"><option value="yes">Já recebido</option><option value="no">Pendente</option></select></div>
        <div><Label htmlFor="revenue-method">Forma de pagamento</Label><select id="revenue-method" name="paymentMethod" className={fieldClass}>{paymentMethods.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
      </div>
      <Feedback state={state} />
      <Button type="submit" disabled={pending} className="w-full">{pending ? "Salvando..." : "Registrar receita"}</Button>
    </form>
  );
}

function ExpenseForm({ data, professionalSlug }: { data: FinancialDashboardData; professionalSlug: ProfessionalSlug }) {
  const [state, action, pending] = useActionState(createExpense, initialFinancialActionState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.status === "success") formRef.current?.reset(); }, [state]);
  return (
    <form ref={formRef} action={action} className="space-y-4">
      <div><Label htmlFor="expense-description">Descrição</Label><Input id="expense-description" name="description" placeholder="Ex.: Compra de materiais" required /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><Label htmlFor="expense-amount">Valor</Label><Input id="expense-amount" name="amount" inputMode="decimal" placeholder="0,00" required /></div>
        <div><Label htmlFor="expense-date">Data</Label><Input id="expense-date" name="competenceDate" type="date" defaultValue={`${data.month}-01`} required /></div>
      </div>
      <div><Label htmlFor="expense-category">Categoria</Label><select id="expense-category" name="categoryId" className={fieldClass} required><option value="">Selecione</option>{data.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><Label htmlFor="expense-owner">Responsabilidade</Label><select id="expense-owner" name="responsibility" className={fieldClass}><option value={professionalSlug}>Minha despesa</option><option value="shared">Compartilhada</option></select></div>
        <div><Label htmlFor="expense-paid">Situação</Label><select id="expense-paid" name="paid" className={fieldClass} defaultValue="yes"><option value="yes">Paga</option><option value="no">Pendente</option></select></div>
      </div>
      <div><Label htmlFor="expense-method">Forma de pagamento</Label><select id="expense-method" name="paymentMethod" className={fieldClass}>{paymentMethods.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
      <Feedback state={state} />
      <Button type="submit" variant="gold" disabled={pending} className="w-full">{pending ? "Salvando..." : "Registrar despesa"}</Button>
    </form>
  );
}

export function FinancialDashboard({ data, professionalSlug }: { data: FinancialDashboardData; professionalSlug: ProfessionalSlug }) {
  const router = useRouter();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border bg-white/70 p-4">
        <div><p className="text-sm font-medium capitalize">{data.monthLabel}</p><p className="text-xs text-muted-foreground">Visão consolidada da clínica</p></div>
        <Input aria-label="Selecionar mês" type="month" value={data.month} onChange={(event) => router.push(`/financeiro?mes=${event.target.value}`)} className="w-auto" />
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Metric label="Faturamento" value={data.metrics.billedCents} note="Receitas lançadas por competência" />
        <Metric label="Recebido" value={data.metrics.receivedCents} note="Entradas efetivas no mês" tone="positive" />
        <Metric label="A receber" value={data.metrics.pendingCents} note="Saldo real após pagamentos parciais" />
        <Metric label="Despesas lançadas" value={data.metrics.expensesCents} note="Gastos por competência" tone="negative" />
        <Metric label="Despesas pagas" value={data.metrics.paidExpensesCents} note="Saídas efetivas no mês" tone="negative" />
        <Metric label="Resultado de caixa" value={data.metrics.resultCents} note="Recebido menos despesas pagas" tone={data.metrics.resultCents >= 0 ? "positive" : "negative"} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card><CardHeader><CardTitle>Fluxo diário</CardTitle><CardDescription>Entradas e saídas efetivamente pagas</CardDescription></CardHeader><CardContent className="h-80"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data.daily}><defs><linearGradient id="gain" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#b66f8b" stopOpacity={0.35}/><stop offset="95%" stopColor="#b66f8b" stopOpacity={0}/></linearGradient><linearGradient id="cost" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#c5a06a" stopOpacity={0.3}/><stop offset="95%" stopColor="#c5a06a" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0d4e0"/><XAxis dataKey="day" tickLine={false} axisLine={false}/><YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `R$ ${value}`}/><Tooltip formatter={(value) => currency.format(Number(value))}/><Area type="monotone" dataKey="ganhos" stroke="#b66f8b" fill="url(#gain)" strokeWidth={2}/><Area type="monotone" dataKey="gastos" stroke="#c5a06a" fill="url(#cost)" strokeWidth={2}/></AreaChart></ResponsiveContainer></CardContent></Card>
        <Card><CardHeader><CardTitle>Recebido por profissional</CardTitle><CardDescription>Participação nas entradas do mês</CardDescription></CardHeader><CardContent className="h-80"><ResponsiveContainer width="100%" height="75%"><PieChart><Pie data={data.byProfessional} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={3}>{data.byProfessional.map((item) => <Cell key={item.name} fill={item.color}/>)}</Pie><Tooltip formatter={(value) => currency.format(Number(value))}/></PieChart></ResponsiveContainer><div className="flex flex-wrap justify-center gap-4">{data.byProfessional.map((item) => <span key={item.name} className="flex items-center gap-2 text-xs"><i className="size-2 rounded-full" style={{ background: item.color }}/>{item.name}: {currency.format(item.value)}</span>)}</div></CardContent></Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><WalletCards className="size-5"/>Nova receita</CardTitle><CardDescription>O lançamento fica vinculado ao usuário conectado.</CardDescription></CardHeader><CardContent><RevenueForm data={data}/></CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><ReceiptText className="size-5"/>Nova despesa</CardTitle><CardDescription>Registre gastos próprios ou compartilhados.</CardDescription></CardHeader><CardContent><ExpenseForm data={data} professionalSlug={professionalSlug}/></CardContent></Card>
      </section>

      <Card><CardHeader><CardTitle>Últimos lançamentos</CardTitle><CardDescription>Receitas e despesas por data de competência</CardDescription></CardHeader><CardContent>{data.transactions.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum lançamento neste mês.</p> : <div className="divide-y divide-border">{data.transactions.map((item) => <div key={`${item.kind}-${item.id}`} className="flex items-center justify-between gap-4 py-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{item.description}</p><p className="text-xs text-muted-foreground">{new Date(`${item.date}T12:00:00`).toLocaleDateString("pt-BR")} · {item.status}</p></div><p className={`whitespace-nowrap font-medium ${item.kind === "income" ? "text-success" : "text-destructive"}`}>{item.kind === "income" ? "+" : "−"} {money(item.amountCents)}</p></div>)}</div>}</CardContent></Card>
    </div>
  );
}
