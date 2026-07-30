import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resolveRequestOrigin } from "@/lib/utils/request-origin";

// Stripe sends users here if the account link expires before they finish.
// We redirect them back to the /connect page which will generate a fresh link.
export async function GET(req: NextRequest) {
  const origin = await resolveRequestOrigin(req);
  const poolId = req.nextUrl.searchParams.get("poolId");
  if (!poolId) return NextResponse.redirect(new URL("/baby", origin));

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: rows } = await supabase.rpc("get_pool_connect_info", {
    p_pool_id: poolId,
  });

  const pool = rows?.[0];
  const dest = pool?.slug
    ? `/baby/${pool.slug}/connect?status=refresh`
    : "/baby";
  return NextResponse.redirect(new URL(dest, origin));
}
