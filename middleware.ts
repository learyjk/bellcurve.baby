import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

// export const config = {
//   matcher: [
//     /*
//      * Match all request paths except for the ones starting with:
//      * - _next/static (static files)
//      * - _next/image (image optimization files)
//      * - favicon.ico (favicon file)
//      * - api/stripe/webhook (Stripe webhook)
//      * Feel free to modify this pattern to include more paths.
//      */
//     "/((?!_next/static|_next/image|favicon.ico|api/stripe/webhook).*)",
//   ],
// };

export const config = {
  matcher: [
    // Exclude api/stripe/webhook explicitly so Stripe POSTs are not intercepted
    // by this middleware and cause redirects (307). Keep other exclusions.
    "/((?!api/stripe/webhook|api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.[^/]+$).*)",
  ],
};
