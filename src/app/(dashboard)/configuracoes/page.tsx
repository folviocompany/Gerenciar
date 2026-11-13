import { AppHeader } from "@/components/layout/app-header";
import { requireAuthContext } from "@/features/auth/get-auth-context";
import { SettingsForms } from "@/features/settings/settings-forms";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const context = await requireAuthContext();
  const supabase = await createClient();
  const { data: settings, error } = await supabase
    .from("business_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error || !settings) {
    throw new Error("Não foi possível carregar as configurações.");
  }

  return (
    <div>
      <AppHeader
        professional={context.professional}
        title="Configurações"
        subtitle="Perfil, participação societária e reserva de caixa."
      />
      <SettingsForms
        profile={context.profile}
        professional={context.professional}
        settings={settings}
      />
    </div>
  );
}
