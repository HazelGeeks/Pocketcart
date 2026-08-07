import { hasSupabaseEnv, supabase } from "../supabaseClient";
import { isSessionMissing, missingEnvResult, userFromAuth } from "./shared";
import type { AdminUser, ServiceResult } from "./types";

export async function getAdminUser(): Promise<ServiceResult<AdminUser | null>> {
  if (!hasSupabaseEnv || !supabase) return missingEnvResult(null);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    if (isSessionMissing(error.message)) return { data: null, error: null };
    return { data: null, error: error.message };
  }

  return { data: userFromAuth(user), error: null };
}

export async function getAdminAccess(): Promise<ServiceResult<boolean>> {
  if (!hasSupabaseEnv || !supabase) return missingEnvResult(false);

  const { data, error } = await supabase.rpc("is_admin");
  if (error) return { data: false, error: error.message };
  return { data: data === true, error: null };
}

export async function signInAdmin(params: {
  email: string;
  password: string;
}): Promise<ServiceResult<AdminUser | null>> {
  if (!hasSupabaseEnv || !supabase) return missingEnvResult(null);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: params.email.trim(),
    password: params.password,
  });

  if (error) return { data: null, error: error.message };
  return { data: userFromAuth(data.user ?? null), error: null };
}

export async function signOutAdmin(): Promise<ServiceResult<null>> {
  if (!hasSupabaseEnv || !supabase) return missingEnvResult(null);

  const { error } = await supabase.auth.signOut();
  return { data: null, error: error ? error.message : null };
}
