import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { Database } from "@/database.types";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

type BetInsert = Database["public"]["Tables"]["bets"]["Insert"];

async function createBet(bet: BetInsert) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bets")
    .insert(bet)
    .select()
    .single();

  if (error) {
    console.error("Error creating bet from webhook:", error);
    throw new Error(error.message);
  }

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

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const { poolId, userId, guessDate, guessWeight, price } =
      session.metadata || {};

    if (!poolId || !userId || !guessDate || !guessWeight || !price) {
      return new NextResponse(
        `Webhook Error: Missing metadata: ${JSON.stringify(session.metadata)}`,
        {
          status: 400,
        }
      );
    }

    try {
      await createBet({
        pool_id: poolId,
        user_id: userId,
        guessed_birth_date: guessDate,
        guessed_weight: Number(guessWeight),
        calculated_price: Number(price),
        payment_status: "paid",
      });

      console.log(
        `Successfully created bet for user ${userId} and pool ${poolId}.`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Failed to create bet from webhook", message);
      return new NextResponse("Webhook Error: Could not create bet", {
        status: 500,
      });
    }
  } else {
    console.warn(`Unhandled event type: ${event.type}`);
  }

  return new NextResponse(JSON.stringify({ received: true }), { status: 200 });
}
