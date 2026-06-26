import type { User } from "@supabase/supabase-js";
import {
  hasSupabaseEnv,
  supabase,
  supabaseAnonKey,
  supabaseUrl,
} from "./supabaseClient";

const authRedirectUrl = process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL?.trim() ?? "";

export type UserProfile = {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
};

type ServiceResult<T> = {
  data: T;
  error: string | null;
};

function isAuthSessionMissing(message?: string | null): boolean {
  const normalized = message?.toLowerCase() ?? "";
  return (
    normalized.includes("auth session missing") ||
    normalized.includes("session not found")
  );
}

function missingEnvResult<T>(fallback: T): ServiceResult<T> {
  return {
    data: fallback,
    error: "Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.",
  };
}

function profileFromUser(user: User): UserProfile {
  return {
    id: user.id,
    email: user.email ?? "",
    full_name: (user.user_metadata?.full_name as string | undefined) ?? null,
    created_at: user.created_at,
  };
}

async function upsertProfileFromUser(user: User): Promise<string | null> {
  if (!supabase) return "Supabase client is not initialized.";

  const payload = {
    id: user.id,
    email: user.email ?? "",
    full_name: (user.user_metadata?.full_name as string | undefined) ?? null,
  };

  const { error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" });

  return error ? error.message : null;
}

export async function signUpUser(params: {
  name: string;
  email: string;
  password: string;
}): Promise<ServiceResult<{ awaitingVerification: boolean }>> {
  if (!hasSupabaseEnv || !supabase) {
    return missingEnvResult({ awaitingVerification: false });
  }

  const { name, email, password } = params;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      ...(authRedirectUrl ? { emailRedirectTo: authRedirectUrl } : {}),
      data: {
        full_name: name,
      },
    },
  });

  if (error) {
    return {
      data: { awaitingVerification: false },
      error: error.message,
    };
  }

  return {
    data: { awaitingVerification: !data.session },
    error: null,
  };
}

export async function signInUser(params: {
  email: string;
  password: string;
}): Promise<ServiceResult<UserProfile | null>> {
  if (!hasSupabaseEnv || !supabase) {
    return missingEnvResult(null);
  }

  const { email, password } = params;
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      data: null,
      error: error.message,
    };
  }

  if (!data.user) {
    return {
      data: null,
      error: "Unable to read signed-in user.",
    };
  }

  const profileError = await upsertProfileFromUser(data.user);
  if (profileError) {
    return {
      data: profileFromUser(data.user),
      error: profileError,
    };
  }

  return {
    data: profileFromUser(data.user),
    error: null,
  };
}

export async function getCurrentUserProfile(): Promise<
  ServiceResult<UserProfile | null>
> {
  if (!hasSupabaseEnv || !supabase) {
    return missingEnvResult(null);
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    if (isAuthSessionMissing(userError.message)) {
      return {
        data: null,
        error: null,
      };
    }
    return {
      data: null,
      error: userError.message,
    };
  }

  if (!user) {
    return {
      data: null,
      error: null,
    };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return {
      data: profileFromUser(user),
      error: error.message,
    };
  }

  if (!data) {
    const upsertError = await upsertProfileFromUser(user);
    if (upsertError) {
      return {
        data: profileFromUser(user),
        error: upsertError,
      };
    }
    return {
      data: profileFromUser(user),
      error: null,
    };
  }

  return {
    data,
    error: null,
  };
}

export async function signOutUser(): Promise<ServiceResult<null>> {
  if (!hasSupabaseEnv || !supabase) {
    return missingEnvResult(null);
  }

  const { error } = await supabase.auth.signOut();

  return {
    data: null,
    error: error ? error.message : null,
  };
}

export async function deleteCurrentUserAccount(): Promise<ServiceResult<null>> {
  if (!hasSupabaseEnv || !supabase) {
    return missingEnvResult(null);
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    return { data: null, error: sessionError.message };
  }

  if (!session?.access_token) {
    return { data: null, error: "Please sign in first." };
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/delete-account`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: supabaseAnonKey,
      "Content-Type": "application/json",
    },
    body: "{}",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as {
      error?: string;
    } | null;
    return {
      data: null,
      error: payload?.error ?? "Unable to delete account.",
    };
  }

  await supabase.auth.signOut().catch(() => undefined);
  return { data: null, error: null };
}
