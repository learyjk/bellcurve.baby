import { createClient } from "@/lib/supabase/server";

/**
 * Returns the authed user if their email is in ADMIN_EMAILS, else null.
 * Same gate as /admin/fees and refundGuess.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return adminEmails.includes(user.email?.toLowerCase() ?? "") ? user : null;
}
