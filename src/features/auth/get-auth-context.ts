import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ProfessionalRow, ProfileRow } from "@/types/database";

export type AuthContext = {
  userId: string;
  email: string | undefined;
  profile: ProfileRow;
  professional: ProfessionalRow;
};

export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || !profile.is_active) {
    return null;
  }

  const { data: professional, error: professionalError } = await supabase
    .from("professionals")
    .select("*")
    .eq("id", profile.professional_id)
    .maybeSingle();

  if (professionalError || !professional || !professional.is_active) {
    return null;
  }

  return {
    userId: user.id,
    email: user.email,
    profile,
    professional,
  };
}

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireAuthContext(): Promise<AuthContext> {
  const user = await requireUser();
  const context = await getAuthContext();

  if (!context) {
    redirect("/conta-pendente");
  }

  if (context.userId !== user.id) {
    redirect("/login");
  }

  return context;
}
