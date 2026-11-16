import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clientFormSchema, formatPhone, normalizePhone } from '../src/features/clients/schema.ts';

const validClient = { fullName: 'Maria de Teste', phone: '(92) 99999-9999', birthDate: '', referenceProfessionalId: '', notes: '', whatsappAllowed: true, active: true };

test('normaliza e formata telefone brasileiro', () => {
  assert.equal(normalizePhone('(92) 99999-9999'), '92999999999');
  assert.equal(formatPhone('92999999999'), '(92) 99999-9999');
  assert.equal(formatPhone('5592999999999'), '(92) 99999-9999');
});

test('aceita cadastro administrativo mínimo', () => {
  assert.equal(clientFormSchema.safeParse(validClient).success, true);
});

test('rejeita telefone e observações fora dos limites', () => {
  assert.equal(clientFormSchema.safeParse({ ...validClient, phone: '123' }).success, false);
  assert.equal(clientFormSchema.safeParse({ ...validClient, notes: 'x'.repeat(1001) }).success, false);
});
