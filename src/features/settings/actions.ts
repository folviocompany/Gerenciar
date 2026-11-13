"use server";

import { revalidatePath } from "next/cache";
import { requireAuthContext } from "@/features/auth/get-auth-context";
import { createClient } from "@/lib/supabase/server";
import { parseBRLToCents } from "@/lib/money";
import { businessSettingsSchema, profileSettingsSchema } from "@/lib/validations/settings";

export type ActionState = {
  ok: boolean;
  message: string;
};

export async function updateProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = profileSettingsSchema.safeParse({
    fullName: formData.get("fullName"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const context = await requireAuthContext();
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName })
    .eq("id", context.userId);

  if (error) {
    return { ok: false, message: "Não foi possível atualizar o perfil." };
  }

  await supabase.rpc("write_audit_log", {
    p_action: "profile.update",
    p_entity_type: "profiles",
    p_entity_id: context.userId,
    p_metadata: { fields: ["full_name"] },
  });

  revalidatePath("/");
  revalidatePath("/configuracoes");
  return { ok: true, message: "Perfil atualizado." };
}

export async function updateBusinessSettingsAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = businessSettingsSchema.safeParse({
    clinicName: formData.get("clinicName"),
    esterShareBps: formData.get("esterShareBps"),
    izabelaShareBps: formData.get("izabelaShareBps"),
    cashReserveAmount: formData.get("cashReserveAmount"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  let cashReserveCents: bigint;
  try {
    cashReserveCents = parseBRLToCents(parsed.data.cashReserveAmount);
    if (cashReserveCents < 0n) {
      return { ok: false, message: "A reserva de caixa não pode ser negativa." };
    }
  } catch {
    return { ok: false, message: "Informe a reserva de caixa no formato 0,00" };
  }

  await requireAuthContext();
  const supabase = await createClient();

  const { error } = await supabase
    .from("business_settings")
    .update({
      clinic_name: parsed.data.clinicName,
      ester_share_bps: parsed.data.esterShareBps,
      izabela_share_bps: parsed.data.izabelaShareBps,
      cash_reserve_cents: Number(cashReserveCents),
      notes: parsed.data.notes || null,
    })
    .eq("id", 1);

  if (error) {
    return { ok: false, message: "Não foi possível salvar as configurações da clínica." };
  }

  await supabase.rpc("write_audit_log", {
    p_action: "business_settings.update",
    p_entity_type: "business_settings",
    p_entity_id: null,
    p_metadata: {
      ester_share_bps: parsed.data.esterShareBps,
      izabela_share_bps: parsed.data.izabelaShareBps,
    },
  });

  revalidatePath("/");
  revalidatePath("/configuracoes");
  return { ok: true, message: "Configurações da clínica atualizadas." };
}
