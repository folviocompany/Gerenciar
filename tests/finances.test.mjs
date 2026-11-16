import { test } from 'node:test';
import assert from 'node:assert/strict';
import { expenseFormSchema, moneyToCents, revenueFormSchema } from '../src/features/finances/schema.ts';

const revenue = { description: 'Atendimento', amount: '300,00', serviceDate: '2026-11-15', dueDate: '2026-11-15', clientId: '', procedureId: '', initialPayment: '100,00', paymentMethod: 'pix', paidAt: '2026-11-15' };
const expense = { description: 'Material', category: 'Insumos', amount: '50,00', competenceDate: '2026-11-01', dueDate: '2026-11-10', responsibility: 'individual', status: 'pending', paidAt: '', paymentMethod: '', notes: '' };

test('converte valores financeiros para centavos', () => {
  assert.equal(moneyToCents('300,00'), 30000);
  assert.equal(moneyToCents('0'), 0);
});
test('aceita pagamento parcial e receita pendente', () => {
  assert.equal(revenueFormSchema.safeParse(revenue).success, true);
  assert.equal(revenueFormSchema.safeParse({ ...revenue, initialPayment: '0', paymentMethod: '', paidAt: '' }).success, true);
});
test('rejeita recebimento acima do faturamento ou sem forma de pagamento', () => {
  assert.equal(revenueFormSchema.safeParse({ ...revenue, initialPayment: '400,00' }).success, false);
  assert.equal(revenueFormSchema.safeParse({ ...revenue, paymentMethod: '' }).success, false);
});
test('gasto pago exige data e forma de pagamento', () => {
  assert.equal(expenseFormSchema.safeParse(expense).success, true);
  assert.equal(expenseFormSchema.safeParse({ ...expense, status: 'paid' }).success, false);
  assert.equal(expenseFormSchema.safeParse({ ...expense, status: 'paid', paidAt: '2026-11-10', paymentMethod: 'pix' }).success, true);
});
