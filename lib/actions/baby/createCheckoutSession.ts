"use server";

import { createClient } from "@/lib/supabase/server";
import { PLATFORM_FEE_PERCENT } from "@/lib/constants";
import { getStripe } from "@/lib/stripe";

// Helper function to get the base URL with proper protocol
function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    if (process.env.NEXT_PUBLIC_BASE_URL.startsWith("http")) {
      return process.env.NEXT_PUBLIC_BASE_URL;
    }
    const isLocalhost = process.env.NEXT_PUBLIC_BASE_URL.includes("localhost");
    const protocol = isLocalhost ? "http://" : "https://";
    return `${protocol}${process.env.NEXT_PUBLIC_BASE_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export type CreateCheckoutSessionState = {
  sessionId?: string;
  error?: string;
  connectRequired?: boolean; // pool owner hasn't connected Stripe yet
};

export async function createCheckoutSession(
  prevState: CreateCheckoutSessionState,
  data: {
    poolId: string;
    slug: string;
    guessDate: string;
    guessWeight: number;
    price: number;
    babyName: string;
    name?: string;
    isAnonymous?: boolean;
  }
): Promise<CreateCheckoutSessionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to make a guess." };
  }

  // Fetch pool to get Stripe Connect account info
  const { data: pool, error: poolError } = await supabase
    .from("pools")
    .select("stripe_account_id, stripe_onboarding_complete")
    .eq("id", data.poolId)
    .single();

  if (poolError || !pool) {
    return { error: "Pool not found." };
  }

  if (!pool.stripe_account_id || !pool.stripe_onboarding_complete) {
    return {
      error:
        "This pool isn\u2019t accepting payments yet \u2014 the organizer needs to connect their Stripe account.",
      connectRequired: true,
    };
  }

  try {
    const dateForFormat = (() => {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data.guessDate);
      if (m) {
        return new Date(
          Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0)
        );
      }
      return new Date(data.guessDate);
    })();
    const formattedDate = new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(dateForFormat);
    const lbs = Math.floor(data.guessWeight / 16);
    const oz = Math.round(data.guessWeight % 16);
    const formattedWeight = `${lbs} lbs ${oz} oz`;

    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Guess on ${data.babyName}`,
              description: `Your guess: ${formattedDate} at ${formattedWeight}`,
            },
            unit_amount: Math.round(data.price * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${getBaseUrl()}/baby/${data.slug}?payment=success`,
      cancel_url: `${getBaseUrl()}/baby/${data.slug}?payment=cancelled`,
      // Route funds directly to the pool creator's connected Stripe account,
      // keeping the platform fee (creator takes home 90% of each guess).
      payment_intent_data: {
        application_fee_amount: Math.round(
          data.price * 100 * PLATFORM_FEE_PERCENT
        ),
        transfer_data: {
          destination: pool.stripe_account_id,
        },
      },
      metadata: {
        poolId: data.poolId,
        slug: data.slug,
        userId: user.id,
        guessDate: data.guessDate,
        guessWeight: data.guessWeight.toString(),
        price: data.price.toString(),
        name: data.name || user.user_metadata?.name || "",
        isAnonymous: data.isAnonymous?.toString() || "false",
        stripeAccountId: pool.stripe_account_id,
      },
    });

    return { sessionId: session.id };
  } catch (error) {
    console.error("Error creating Stripe checkout session:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { error: `Could not create checkout session: ${message}` };
  }
}
