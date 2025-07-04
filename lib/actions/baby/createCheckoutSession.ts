"use server";
//hi

import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function createCheckoutSession(data: {
  poolId: string;
  slug: string;
  guessDate: string;
  guessWeight: number;
  price: number;
  babyName: string;
  nickname?: string;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to place a bet." };
  }

  try {
    const formattedDate = new Date(data.guessDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const formattedWeight = `${data.guessWeight.toFixed(1)} lbs`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Bet on ${data.babyName}`,
              description: `Your guess: ${formattedDate} at ${formattedWeight}`,
            },
            unit_amount: Math.round(data.price * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/baby/${data.slug}?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/baby/${data.slug}?payment=cancelled`,
      metadata: {
        poolId: data.poolId,
        slug: data.slug,
        userId: user.id,
        guessDate: data.guessDate,
        guessWeight: data.guessWeight.toString(),
        price: data.price.toString(),
        nickname: data.nickname || user.user_metadata?.name || "",
      },
    });

    return { sessionId: session.id };
  } catch (error) {
    console.error("Error creating Stripe checkout session:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { error: `Could not create checkout session: ${message}` };
  }
}
