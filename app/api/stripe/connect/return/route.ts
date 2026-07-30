import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { resolveRequestOrigin } from "@/lib/utils/request-origin";

function getAnonClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET(req: NextRequest) {
  const origin = await resolveRequestOrigin(req);
  const poolId = req.nextUrl.searchParams.get("poolId");
  if (!poolId) {
    return NextResponse.redirect(new URL("/baby", origin));
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const supabase = getAnonClient();

  const { data: rows } = await supabase.rpc("get_pool_connect_info", {
    p_pool_id: poolId,
  });

  const pool = rows?.[0];
  if (!pool?.slug) {
    return NextResponse.redirect(new URL("/baby", origin));
  }

  const connectPage = new URL(`/baby/${pool.slug}/connect`, origin);

  if (!pool.stripe_account_id) {
    connectPage.searchParams.set("status", "incomplete");
    return NextResponse.redirect(connectPage);
  }

  // Check with Stripe whether this account can actually accept charges
  const account = await stripe.accounts.retrieve(pool.stripe_account_id);

  if (account.charges_enabled) {
    await supabase.rpc("mark_pool_stripe_connected", {
      p_stripe_account_id: pool.stripe_account_id,
    });
    return NextResponse.redirect(
      new URL(`/baby/${pool.slug}?connect=success`, origin)
    );
  }

  // Onboarding started but not finished
  connectPage.searchParams.set("status", "incomplete");
  return NextResponse.redirect(connectPage);
}
