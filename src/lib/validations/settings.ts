import { z } from "zod";

export const profileSettingsSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Informe o nome")
    .max(120, "Nome muito longo"),
});

export const businessSettingsSchema = z
  .object({
    clinicName: z
      .string()
      .trim()
      .min(2, "Informe o nome da clínica")
      .max(80, "Nome muito longo"),
    esterShareBps: z.coerce.number().int().min(0).max(10000),
    izabelaShareBps: z.coerce.number().int().min(0).max(10000),
    cashReserveAmount: z.string().trim().min(1, "Informe a reserva de caixa"),
    notes: z.string().trim().max(2000).optional().or(z.literal("")),
  })
  .refine((value) => value.esterShareBps + value.izabelaShareBps === 10000, {
    message: "A soma das participações deve ser 100%",
    path: ["izabelaShareBps"],
  });

export type ProfileSettingsInput = z.infer<typeof profileSettingsSchema>;
export type BusinessSettingsInput = z.infer<typeof businessSettingsSchema>;
