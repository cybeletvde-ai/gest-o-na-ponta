import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;
  const url = import.meta.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
  const key = (import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) as string | undefined;
  if (!url || !key) throw new Error("Supabase não está configurado neste ambiente.");
  client = createClient(url, key, {
    auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return client;
}

export function authRedirectUrl(): string {
  return (
    (import.meta.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL as string | undefined) ??
    `${window.location.origin}/auth/callback`
  );
}
