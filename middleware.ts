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
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/stripe/webhook (Stripe webhook)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|.*\\.(svg|png|jpg|jpeg|webp|gif|avif)|favicon.ico|favicon.png|api/stripe/webhook).*)",
  ],
};
