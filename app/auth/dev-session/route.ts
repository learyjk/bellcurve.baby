import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { resolveRequestOrigin } from "@/lib/utils/request-origin";

/**
 * Dev-only helper: exchange an access_token/refresh_token pair (e.g. from a
 * magic link) for server-side session cookies, then redirect to `next`.
 * Disabled in production builds.
 */
export async function GET(request: Request) {
  const origin = await resolveRequestOrigin(request);

  if (process.env.NODE_ENV === "production") {
    return NextResponse.redirect(`${origin}/auth/error?error=Not available`);
  }

  const { searchParams } = new URL(request.url);
  const accessToken = searchParams.get("access_token");
  const refreshToken = searchParams.get("refresh_token");
  const next = searchParams.get("next") ?? "/baby";

  if (!accessToken || !refreshToken) {
    return NextResponse.redirect(
      `${origin}/auth/error?error=Missing tokens`
    );
  }

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

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) {
    return NextResponse.redirect(
      `${origin}/auth/error?error=${encodeURIComponent(error.message)}`
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}
