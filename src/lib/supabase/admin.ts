import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/env";

let cached: SupabaseClient | null = null;

export function getSupabaseAdmin() {
  if (cached) {
    return cached;
  }

  const env = getServerEnv();
  cached = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  return cached;
}
