import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL.startsWith("http")
      ? process.env.NEXT_PUBLIC_BASE_URL
      : `https://${process.env.NEXT_PUBLIC_BASE_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { poolId } = await req.json();
  if (!poolId) {
    return NextResponse.json({ error: "poolId required" }, { status: 400 });
  }

  // Verify the pool belongs to this user
  const { data: pool, error: poolError } = await supabase
    .from("pools")
    .select("id, slug, stripe_account_id, stripe_onboarding_complete, user_id")
    .eq("id", poolId)
    .single();

  if (poolError || !pool) {
    return NextResponse.json({ error: "Pool not found" }, { status: 404 });
  }

  if (pool.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // If already fully onboarded, just return success
  if (pool.stripe_onboarding_complete && pool.stripe_account_id) {
    return NextResponse.json({ alreadyConnected: true });
  }

  // Reuse existing account id if one was already created (user is resuming)
  let accountId = pool.stripe_account_id;

  if (!accountId) {
    // Create a new Express account
    try {
      const account = await stripe.accounts.create({
        type: "express",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: {
          pool_id: poolId,
          user_id: user.id,
        },
      });
      accountId = account.id;
    } catch (err) {
      const message =
        err instanceof Stripe.errors.StripeError
          ? err.message
          : "Failed to create Stripe account";
      return NextResponse.json({ error: message }, { status: 502 });
    }

    // Persist immediately so we can resume if user navigates away
    await supabase
      .from("pools")
      .update({ stripe_account_id: accountId })
      .eq("id", poolId);
  }

  const base = getBaseUrl();
  let accountLink: Stripe.AccountLink;
  try {
    accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${base}/api/stripe/connect/refresh?poolId=${poolId}`,
      return_url: `${base}/api/stripe/connect/return?poolId=${poolId}`,
      type: "account_onboarding",
    });
  } catch (err) {
    const message =
      err instanceof Stripe.errors.StripeError
        ? err.message
        : "Failed to create Stripe onboarding link";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  return NextResponse.json({ url: accountLink.url });
}
