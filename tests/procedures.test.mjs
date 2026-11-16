import { test } from 'node:test';
import assert from 'node:assert/strict';
import { centsToPriceInput, priceToCents, procedureFormSchema } from '../src/features/procedures/schema.ts';

const validProcedure = {
  name: 'Volume brasileiro',
  category: 'Cílios',
  description: '',
  price: '150,00',
  durationMinutes: '60',
  returnIntervalDays: '21',
  requiresReturnConfirmation: true,
  active: true,
};

test('converte preço decimal em centavos sem ponto flutuante persistido', () => {
  assert.equal(priceToCents('150,00'), 15000);
  assert.equal(priceToCents('99.9'), 9990);
  assert.equal(centsToPriceInput(15000), '150,00');
});

test('aceita procedimento completo e retorno opcional', () => {
  assert.equal(procedureFormSchema.safeParse(validProcedure).success, true);
  assert.equal(procedureFormSchema.safeParse({ ...validProcedure, returnIntervalDays: '' }).success, true);
});

test('rejeita valores, duração e intervalo fora dos limites do banco', () => {
  assert.equal(procedureFormSchema.safeParse({ ...validProcedure, price: '-1' }).success, false);
  assert.equal(procedureFormSchema.safeParse({ ...validProcedure, durationMinutes: '0' }).success, false);
  assert.equal(procedureFormSchema.safeParse({ ...validProcedure, returnIntervalDays: '3651' }).success, false);
});

test('normaliza textos e limita descrição', () => {
  const result = procedureFormSchema.safeParse({ ...validProcedure, name: '  Volume brasileiro  ' });
  assert.equal(result.success, true);
  if (result.success) assert.equal(result.data.name, 'Volume brasileiro');
  assert.equal(procedureFormSchema.safeParse({ ...validProcedure, description: 'x'.repeat(501) }).success, false);
});
