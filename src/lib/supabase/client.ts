import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/** Cliente do Lovable Cloud (gerado). Tipado de forma solta porque o store monta selects dinâmicos. */
export function getSupabase(): SupabaseClient {
  return supabase as unknown as SupabaseClient;
}

export function authRedirectUrl(): string {
  return `${window.location.origin}/auth/callback`;
}

export function resetRedirectUrl(): string {
  return `${window.location.origin}/reset-password`;
}
