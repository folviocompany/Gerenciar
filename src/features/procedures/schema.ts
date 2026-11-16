import { z } from 'zod';

const requiredText = (label: string, max: number) =>
  z.string().trim().min(1, `${label} é obrigatório.`).max(max, `${label} deve ter até ${max} caracteres.`);

const pricePattern = /^\d{1,7}([.,]\d{1,2})?$/;
const integerPattern = /^\d+$/;

export const procedureFormSchema = z.object({
  id: z.uuid().optional(),
  name: requiredText('Nome', 120),
  category: requiredText('Categoria', 80),
  description: z.string().trim().max(500, 'A descrição deve ter até 500 caracteres.'),
  price: z
    .string()
    .trim()
    .min(1, 'Valor é obrigatório.')
    .regex(pricePattern, 'Informe um valor válido, como 150,00.'),
  durationMinutes: z
    .string()
    .trim()
    .regex(integerPattern, 'Informe a duração em minutos.')
    .refine((value) => Number(value) >= 5 && Number(value) <= 1440, 'A duração deve ficar entre 5 e 1440 minutos.'),
  returnIntervalDays: z
    .string()
    .trim()
    .refine((value) => value === '' || integerPattern.test(value), 'Informe o intervalo em dias.')
    .refine((value) => value === '' || (Number(value) >= 1 && Number(value) <= 3650), 'O intervalo deve ficar entre 1 e 3650 dias.'),
  requiresReturnConfirmation: z.boolean(),
  active: z.boolean(),
});

export type ProcedureFormValues = z.infer<typeof procedureFormSchema>;

export function priceToCents(value: string) {
  const normalized = value.replace(',', '.');
  return Math.round(Number(normalized) * 100);
}

export function centsToPriceInput(cents: number) {
  return (cents / 100).toFixed(2).replace('.', ',');
}
