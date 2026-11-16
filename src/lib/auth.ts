import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseConfig } from '@/lib/supabase/config';
export const requireMember = cache(async () => {
  if (!getSupabaseConfig()) redirect('/login');
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect('/login');
  const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', user.id).eq('active', true).single();
  if (profileError || !profile) redirect('/login?notice=access');
  const { data: professional } = await supabase.from('professionals').select('*').eq('user_id', user.id).single();
  if (!professional) redirect('/login?notice=access');
  return { supabase, user, profile, professional };
});
