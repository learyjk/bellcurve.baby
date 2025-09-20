import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { Database } from "@/database.types";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Simple in-memory store for processed events (in production, use Redis or database)
const processedEvents = new Map<
  string,
  { timestamp: number; status: string }
>();

// Clean up old processed events (older than 24 hours)
function cleanupProcessedEvents() {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;

  for (const [eventId, data] of processedEvents.entries()) {
    if (now - data.timestamp > oneDayMs) {
      processedEvents.delete(eventId);
    }
  }
}

// Check if event has already been processed
function isEventProcessed(eventId: string): boolean {
  cleanupProcessedEvents();
  return processedEvents.has(eventId);
}

// Mark event as processed
function markEventAsProcessed(eventId: string, status: string) {
  processedEvents.set(eventId, {
    timestamp: Date.now(),
    status,
  });
}

type GuessInsert = Database["public"]["Tables"]["guesses"]["Insert"];

async function createGuess(guess: GuessInsert, paymentIntentId: string) {
  const supabase = await createClient();

  // Add payment_id to the guess for tracking
  const guessWithPaymentId = {
    ...guess,
    payment_id: paymentIntentId,
  };

  const { data, error } = await supabase
    .from("guesses")
    .insert(guessWithPaymentId)
    .select()
    .single();

  if (error) {
    console.error("Error creating guess from webhook:", {
      message: error.message,
      details: error.details,
      code: error.code,
      guess: guessWithPaymentId,
    });
    throw new Error(`Failed to create guess: ${error.message}`);
  }

  console.log("Successfully created guess:", {
    guess_id: data.id,
    pool_id: data.pool_id,
    user_id: data.user_id,
    payment_id: data.payment_id,
  });

  return data;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signatureHeader = await headers()
    .then((h) => h.get("stripe-signature"))
    .catch(() => null);

  if (!signatureHeader) {
    console.error("Missing Stripe signature header");
    return new NextResponse("Webhook Error: Missing Stripe signature header", {
      status: 400,
    });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signatureHeader,
      webhookSecret
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Webhook signature verification failed: ${message}`);
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
  }

  // Add idempotency check using event ID
  const eventId = event.id;
  console.log(`Processing webhook event: ${eventId} (${event.type})`);

  // Check if this event has already been processed
  if (isEventProcessed(eventId)) {
    console.log(`Event ${eventId} already processed, skipping`);
    return new NextResponse(
      JSON.stringify({ received: true, status: "already_processed" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

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

    const { poolId, userId, guessDate, guessWeight, price, name } =
      session.metadata || {};

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
        {
          pool_id: poolId,
          user_id: userId,
          guessed_birth_date: guessDate,
          guessed_weight: numericWeight,
          calculated_price: numericPrice,
          payment_status: "paid",
          name: name || null,
        },
        paymentIntentId
      );

      // Mark event as successfully processed
      markEventAsProcessed(eventId, "success");

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

      // Mark event as failed
      markEventAsProcessed(eventId, `failed: ${message}`);

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
  } else {
    console.log(`Received unhandled event type: ${event.type}`);
    // Mark unhandled events as processed to avoid reprocessing
    markEventAsProcessed(eventId, "unhandled");
  }

  return new NextResponse(JSON.stringify({ received: true }), { status: 200 });
}
