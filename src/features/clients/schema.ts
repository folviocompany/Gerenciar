import { z } from 'zod';

export const clientFormSchema = z.object({
  id: z.uuid().optional(),
  fullName: z.string().trim().min(2, 'Informe o nome completo.').max(150, 'O nome deve ter até 150 caracteres.'),
  phone: z.string().trim().min(1, 'Informe o telefone.').refine((value) => {
    const digits = normalizePhone(value);
    return digits.length >= 10 && digits.length <= 13;
  }, 'Informe um telefone válido com DDD.'),
  birthDate: z.string().refine((value) => value === '' || /^\d{4}-\d{2}-\d{2}$/.test(value), 'Informe uma data válida.'),
  referenceProfessionalId: z.union([z.literal(''), z.uuid()]),
  notes: z.string().trim().max(1000, 'As observações devem ter até 1000 caracteres.'),
  whatsappAllowed: z.boolean(),
  active: z.boolean(),
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;

export function normalizePhone(value: string) {
  return value.replace(/\D/g, '');
}

export function formatPhone(value: string) {
  const digits = normalizePhone(value);
  const local = digits.startsWith('55') && digits.length > 11 ? digits.slice(2) : digits;
  if (local.length === 11) return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  if (local.length === 10) return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  return value;
}
