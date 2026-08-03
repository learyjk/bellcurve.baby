"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getStripe } from "@/lib/stripe";
import Stripe from "stripe";

export type RefundGuessState = {
  error?: string;
  success?: string;
};

export async function refundGuess(
  guessId: string
): Promise<RefundGuessState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in." };
  }

  // Load the guess with its pool
  const { data: guess, error: guessError } = await supabase
    .from("guesses")
    .select("id, pool_id, payment_id, payment_status, calculated_price, name, pools(id, slug, user_id)")
    .eq("id", guessId)
    .single();

  if (guessError || !guess) {
    return { error: "Guess not found." };
  }

  const pool = Array.isArray(guess.pools) ? guess.pools[0] : guess.pools;
  if (!pool) {
    return { error: "Pool not found for this guess." };
  }

  // Only the pool owner can refund (also allow platform admins by email)
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const isOwner = pool.user_id === user.id;
  const isAdmin = adminEmails.includes(user.email?.toLowerCase() ?? "");

  if (!isOwner && !isAdmin) {
    return { error: "Only the pool owner can issue refunds." };
  }

  if (guess.payment_status !== "paid") {
    return {
      error: `This guess can't be refunded (current status: ${guess.payment_status ?? "unknown"}).`,
    };
  }

  if (!guess.payment_id) {
    return { error: "No payment is associated with this guess." };
  }

  try {
    await getStripe().refunds.create({
      payment_intent: guess.payment_id,
      // Return the platform's application fee as well, so the guesser is
      // refunded 100% of their donation. The platform eats Stripe's
      // processing fee on refunds — that's our cost of doing business,
      // not the guesser's or creator's problem.
      refund_application_fee: true,
    });
    // The charge.refunded webhook flips payment_status to 'refunded'
    // (usually within a second). Revalidate so the table updates.
    revalidatePath(`/baby/${pool.slug}`);
    return {
      success: `Refunded $${Number(guess.calculated_price).toFixed(2)} to ${guess.name || "the guesser"}.`,
    };
  } catch (err) {
    console.error("Stripe refund failed:", err);
    const message =
      err instanceof Stripe.errors.StripeError
        ? err.message
        : "Refund failed. Please try again or refund from the Stripe dashboard.";
    return { error: message };
  }
}
