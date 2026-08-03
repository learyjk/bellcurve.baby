import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/database.types";

let stripe: Stripe | null = null;

function getStripeClient() {
  if (stripe) return stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe secret key is not configured");
  stripe = new Stripe(key);
  return stripe;
}

// Anon client — RLS is ON, all DB writes go through SECURITY DEFINER RPCs
function getAnonClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

async function createGuess(
  poolId: string,
  userId: string,
  guessDate: string,
  guessWeight: number,
  price: number,
  paymentIntentId: string,
  name: string | null,
  isAnonymous: boolean,
  livemode: boolean | null
) {
  const supabase = getAnonClient();

  console.log("createGuess via RPC:", { poolId, userId, paymentIntentId });

  const { data, error } = await supabase.rpc("create_guess_from_webhook", {
    p_pool_id: poolId,
    p_user_id: userId,
    p_guessed_birth_date: guessDate,
    p_guessed_weight: guessWeight,
    p_calculated_price: price,
    p_payment_id: paymentIntentId,
    p_name: name ?? "",
    p_is_anonymous: isAnonymous,
    p_livemode: livemode,
  });

  if (error) {
    console.error("RPC create_guess_from_webhook failed:", error);
    throw new Error(`Failed to create guess: ${error.message}`);
  }

  console.log("Guess created via RPC:", data);
  return data;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, stripe-signature",
    },
  });
}

export async function POST(req: NextRequest) {
  console.log("🚀 WEBHOOK POST HANDLER CALLED - START");

  const body = await req.text();
  const signatureHeader = await headers()
    .then((h) => h.get("stripe-signature"))
    .catch(() => null);

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  console.log("Webhook received:", {
    bodyLength: body.length,
    hasSignature: !!signatureHeader,
    signaturePreview: signatureHeader?.substring(0, 50) + "...",
    webhookSecretConfigured: !!webhookSecret,
  });

  if (!signatureHeader) {
    console.error("Missing Stripe signature header");
    return new NextResponse("Webhook Error: Missing Stripe signature header", {
      status: 400,
    });
  }

  let event: Stripe.Event;

  if (!webhookSecret) {
    console.error("Stripe webhook secret not configured");
    return new NextResponse("Webhook Error: webhook secret not configured", {
      status: 500,
    });
  }

  try {
    const s = getStripeClient();
    event = s.webhooks.constructEvent(
      body,
      signatureHeader,
      webhookSecret as string
    );
    console.log("Webhook signature verification successful:", {
      eventType: event.type,
      eventId: event.id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Webhook signature verification failed: ${message}`, {
      error: err,
      bodyPreview: body.substring(0, 200),
      signatureHeader: signatureHeader,
      webhookSecretLength: webhookSecret?.length,
    });
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
  }

  const eventId = event.id;
  console.log(`Processing webhook event: ${eventId} (${event.type})`);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const paymentIntentId = session.payment_intent as string;

    console.log("Processing checkout session:", {
      session_id: session.id,
      payment_intent_id: paymentIntentId,
      payment_status: session.payment_status,
      customer_email: session.customer_details?.email,
      metadata: session.metadata,
    });

    const {
      poolId,
      userId,
      guessDate,
      guessWeight,
      price,
      name,
      is_anonymous,
    } = session.metadata || {};

    // Validate required metadata
    if (!poolId || !userId || !guessDate || !guessWeight || !price) {
      console.error("Missing required metadata:", session.metadata);
      return new NextResponse(
        `Webhook Error: Missing metadata: ${JSON.stringify(session.metadata)}`,
        {
          status: 400,
        }
      );
    }

    // Validate data types
    const numericWeight = Number(guessWeight);
    const numericPrice = Number(price);
    const isAnonymous = is_anonymous === "true";

    if (isNaN(numericWeight) || isNaN(numericPrice)) {
      console.error("Invalid numeric values in metadata:", {
        guessWeight,
        price,
        numericWeight,
        numericPrice,
      });
      return new NextResponse(
        `Webhook Error: Invalid numeric values in metadata`,
        {
          status: 400,
        }
      );
    }

    try {
      await createGuess(
        poolId,
        userId,
        guessDate,
        numericWeight,
        numericPrice,
        paymentIntentId,
        name || null,
        isAnonymous,
        // The Stripe event carries livemode (true = real money, false =
        // sandbox); record it so /admin/fees can separate test vs live
        // without a Stripe lookup per row.
        session.livemode ?? null
      );

      console.log(
        `Successfully created guess for user ${userId} and pool ${poolId}.`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Failed to create guess from webhook:", {
        error: message,
        session_id: session.id,
        payment_intent_id: paymentIntentId,
        user_id: userId,
        pool_id: poolId,
      });

      // Log the failure for manual investigation with all necessary details.
      console.error(
        "=== URGENT: GUESS CREATION FAILED AFTER SUCCESSFUL PAYMENT ===",
        {
          timestamp: new Date().toISOString(),
          event_id: eventId,
          payment_intent_id: paymentIntentId,
          session_id: session.id,
          customer_email: session.customer_details?.email,
          amount_paid: session.amount_total,
          currency: session.currency,
          error_message: message,
          metadata: session.metadata,
          pool_id: poolId,
          user_id: userId,
          guess_data: {
            guessed_birth_date: guessDate,
            guessed_weight: numericWeight,
            calculated_price: numericPrice,
            name: name || null,
          },
        }
      );

      // This is a critical error that needs immediate attention
      // Consider adding alerts/notifications for support team here

      // Return error - don't attempt automatic refund
      // This should be handled by redirecting user to error page or manual support
      return new NextResponse(
        JSON.stringify({
          error: "Could not create guess",
          message:
            "Payment succeeded but guess creation failed. Please contact support.",
          payment_intent_id: paymentIntentId,
          session_id: session.id,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } else if (event.type === "account.updated") {
    // Stripe Connect: sync onboarding status when an account becomes enabled
    const account = event.data.object as Stripe.Account;
    if (account.charges_enabled) {
      const supabase = getAnonClient();
      const { error } = await supabase.rpc("mark_pool_stripe_connected", {
        p_stripe_account_id: account.id,
      });
      if (error) {
        console.error("Failed to mark pool onboarding complete:", error);
      } else {
        console.log(`Marked pool(s) with account ${account.id} as onboarding complete`);
      }
    }
  } else if (event.type === "charge.refunded") {
    // Refund processed (in the Stripe dashboard or via API): mark the guess
    // as refunded so it no longer counts in totals/rankings. The row stays
    // for audit history.
    const charge = event.data.object as Stripe.Charge;
    const paymentIntentId =
      typeof charge.payment_intent === "string"
        ? charge.payment_intent
        : charge.payment_intent?.id;

    if (!paymentIntentId) {
      console.error("charge.refunded without payment_intent:", charge.id);
    } else {
      const supabase = getAnonClient();
      const { error } = await supabase.rpc("mark_guess_refunded", {
        p_payment_id: paymentIntentId,
      });
      if (error) {
        // Not finding a guess just means the charge wasn't one of ours
        // (e.g. a test charge) — log but still 200 so Stripe doesn't retry.
        console.warn(
          `Could not mark guess refunded for ${paymentIntentId}:`,
          error.message
        );
      } else {
        console.log(`Marked guess refunded for payment ${paymentIntentId}`);
      }
    }
  } else {
    console.log(`Received unhandled event type: ${event.type}`);
  }

  return new NextResponse(JSON.stringify({ received: true }), { status: 200 });
}
