import { createServerClient } from "@supabase/ssr";
import { type EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { resolveRequestOrigin } from "@/lib/utils/request-origin";

/**
 * Server-side verification for email links that carry a `token_hash`
 * (e.g. Supabase signup confirmation when the PKCE code-verifier cookie is
 * unavailable — typically because the email was opened on a different
 * device/browser than the one used to sign up).
 *
 * Supabase's default email templates redirect `/auth/v1/verify` links
 * straight through to `redirect_to` with `token_hash` + `type` appended.
 * This route verifies the token server-side via verifyOtp, which does not
 * require the PKCE verifier, then signs the user in.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = await resolveRequestOrigin(request);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/baby";
  const safeNext = next.startsWith("/") ? next : "/baby";

  if (token_hash && type) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore errors in Server Components
            }
          },
        },
      }
    );

    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      // Password-recovery links need to land on the update-password page.
      if (type === "recovery" || safeNext === "/auth/update-password") {
        return NextResponse.redirect(`${origin}/auth/update-password`);
      }
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
    return NextResponse.redirect(
      `${origin}/auth/error?error=${encodeURIComponent(error.message)}`
    );
  }

  return NextResponse.redirect(
    `${origin}/auth/error?error=${encodeURIComponent("Invalid confirmation link")}`
  );
}
