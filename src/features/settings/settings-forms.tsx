"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updateBusinessSettingsAction,
  updateProfileAction,
  type ActionState,
} from "@/features/settings/actions";
import { formatBRLFromCents } from "@/lib/money";
import type { BusinessSettingsRow, ProfessionalRow, ProfileRow } from "@/types/database";

const initialState: ActionState = { ok: false, message: "" };

type SettingsFormsProps = {
  profile: ProfileRow;
  professional: ProfessionalRow;
  settings: BusinessSettingsRow;
};

export function SettingsForms({ profile, professional, settings }: SettingsFormsProps) {
  const [profileState, profileAction, profilePending] = useActionState(
    updateProfileAction,
    initialState,
  );
  const [businessState, businessAction, businessPending] = useActionState(
    updateBusinessSettingsAction,
    initialState,
  );

  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader>
          <CardTitle>Seu perfil</CardTitle>
          <CardDescription>
            Conta vinculada à profissional {professional.display_name}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={profileAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome exibido</Label>
              <Input id="fullName" name="fullName" defaultValue={profile.full_name} required />
            </div>
            <Button type="submit" disabled={profilePending}>
              {profilePending ? "Salvando..." : "Salvar perfil"}
            </Button>
            {profileState.message ? (
              <p className={profileState.ok ? "text-sm text-success" : "text-sm text-destructive"}>
                {profileState.message}
              </p>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Clínica e sociedade</CardTitle>
          <CardDescription>
            Participação inicial 50/50. Os valores são estimativas gerenciais, não lucro contábil.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={businessAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clinicName">Nome da clínica</Label>
              <Input id="clinicName" name="clinicName" defaultValue={settings.clinic_name} required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="esterShareBps">Participação Ester (pontos-base)</Label>
                <Input
                  id="esterShareBps"
                  name="esterShareBps"
                  type="number"
                  min={0}
                  max={10000}
                  defaultValue={settings.ester_share_bps}
                  required
                />
                <p className="text-xs text-muted-foreground">5000 = 50%</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="izabelaShareBps">Participação Izabela (pontos-base)</Label>
                <Input
                  id="izabelaShareBps"
                  name="izabelaShareBps"
                  type="number"
                  min={0}
                  max={10000}
                  defaultValue={settings.izabela_share_bps}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cashReserveAmount">Reserva de caixa</Label>
              <Input
                id="cashReserveAmount"
                name="cashReserveAmount"
                defaultValue={formatBRLFromCents(settings.cash_reserve_cents).replace("R$ ", "")}
                placeholder="0,00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Observações internas</Label>
              <textarea
                id="notes"
                name="notes"
                defaultValue={settings.notes ?? ""}
                className="min-h-28 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
              />
            </div>
            <Button type="submit" disabled={businessPending}>
              {businessPending ? "Salvando..." : "Salvar clínica"}
            </Button>
            {businessState.message ? (
              <p
                className={businessState.ok ? "text-sm text-success" : "text-sm text-destructive"}
              >
                {businessState.message}
              </p>
            ) : null}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
