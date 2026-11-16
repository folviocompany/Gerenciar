'use server';
import { z } from 'zod';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseConfig } from '@/lib/supabase/config';
export type LoginState = { error: string };
const schema = z.object({ email: z.email().max(254), password: z.string().min(1).max(256) });
export async function login(_state: LoginState, form: FormData): Promise<LoginState> {
  if (!getSupabaseConfig()) return { error: 'O acesso será liberado após a configuração da clínica.' };
  const parsed = schema.safeParse({ email: String(form.get('email') ?? '').trim(), password: form.get('password') });
  if (!parsed.success) return { error: 'Informe um e-mail válido e sua senha.' };
  const supabase = await createClient();
  try {
    const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error || !data.user) return { error: 'Não foi possível entrar. Confira seus dados e tente novamente.' };
    const { data: member } = await supabase.from('profiles').select('id').eq('id', data.user.id).eq('active', true).single();
    const { data: professional } = await supabase.from('professionals').select('id').eq('user_id', data.user.id).single();
    if (!member || !professional) {
      await supabase.auth.signOut();
      return { error: 'Seu acesso ainda não está habilitado. Fale com a administração.' };
    }
  } catch { return { error: 'O serviço está indisponível. Tente novamente em instantes.' }; }
  redirect('/inicio');
}
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
