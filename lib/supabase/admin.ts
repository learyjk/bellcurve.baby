import { createClient } from "@supabase/supabase-js";
import { Database } from "@/database.types";

/**
 * Service-role client. Bypasses RLS — use ONLY in server code after
 * verifying the caller is a platform admin (lib/admin/auth).
 * Requires SUPABASE_SERVICE_ROLE_KEY to be set (never NEXT_PUBLIC_).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Uncomment it in .env.local (server-side only)."
    );
  }
  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
