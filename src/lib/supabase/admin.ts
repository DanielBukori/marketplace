import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** Huduma za malipo zinahitaji fungo la service_role; bila linyo tovuti inatumia cash tu. */
export const isAdminClientConfigured = Boolean(url && serviceKey);

/**
 * Client ya seva yenye RLS iliyopuuzwa. Hutumika kuthibitisha webhook,
 * kubadilisha safu za pesa na kutuma malipo — fungo hili halipaswi
 * kufika kivinjari wala kwenye log za umma.
 */
export function createAdminClient() {
  if (!url || !serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY haijawekwa kwenye mazingira ya seva.");
  }

  return createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
