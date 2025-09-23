"use server";

import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Helper function to get the base URL with proper protocol
function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    // If it already has a protocol, use it as is
    if (process.env.NEXT_PUBLIC_BASE_URL.startsWith("http")) {
      return process.env.NEXT_PUBLIC_BASE_URL;
    }
    // Otherwise, add https for production-like URLs or http for localhost
    const isLocalhost = process.env.NEXT_PUBLIC_BASE_URL.includes("localhost");
    const protocol = isLocalhost ? "http://" : "https://";
    return `${protocol}${process.env.NEXT_PUBLIC_BASE_URL}`;
  }

  // Fallback logic
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Development fallback
  return "http://localhost:3000";
}

export type CreateCheckoutSessionState = {
  sessionId?: string;
  error?: string;
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

  try {
    // `data.guessDate` is expected to be a YYYY-MM-DD in PT; render it in PT
    const dateForFormat = (() => {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data.guessDate);
      if (m) {
        const y = Number(m[1]);
        const mo = Number(m[2]);
        const d = Number(m[3]);
        return new Date(Date.UTC(y, mo - 1, d, 12, 0, 0));
      }
      return new Date(data.guessDate);
    })();
    const formattedDate = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(dateForFormat);
    const lbs = Math.floor(data.guessWeight / 16);
    const oz = Math.round(data.guessWeight % 16);
    const formattedWeight = `${lbs} lbs ${oz} oz`;

    const session = await stripe.checkout.sessions.create({
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
      metadata: {
        poolId: data.poolId,
        slug: data.slug,
        userId: user.id,
        guessDate: data.guessDate,
        guessWeight: data.guessWeight.toString(),
        price: data.price.toString(),
        name: data.name || user.user_metadata?.name || "",
        isAnonymous: data.isAnonymous?.toString() || "false",
      },
    });

    return { sessionId: session.id };
  } catch (error) {
    console.error("Error creating Stripe checkout session:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { error: `Could not create checkout session: ${message}` };
  }
}
