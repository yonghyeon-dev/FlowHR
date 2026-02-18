import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getPublicEnv } from "@/lib/env";

let cached: SupabaseClient | null = null;

export function getSupabaseClient() {
  if (cached) {
    return cached;
  }

  const env = getPublicEnv();
  cached = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return cached;
}
