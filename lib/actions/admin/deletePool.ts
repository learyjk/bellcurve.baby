"use server";

import { revalidatePath } from "next/cache";
import { getStripe } from "@/lib/stripe";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminDeletePoolResult = {
  error?: string;
  success?: string;
  refunded?: number;
  refundFailures?: number;
};

/**
 * Admin-only pool deletion with a Stripe-first safety order:
 *   1. Refund every paid guess (refund_application_fee: true — platform
 *      eats Stripe's processing fee, same policy as refundGuess).
 *   2. Delete the pool (guesses + rankings cascade via FK from 006).
 * If any refund fails, the pool is NOT deleted so money is never stranded.
 */
export async function adminDeletePool(
  poolId: string
): Promise<AdminDeletePoolResult> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Not authorized." };

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Admin client unavailable.",
    };
  }

  const { data: pool, error: poolError } = await supabase
    .from("pools")
    .select("id, slug, baby_name")
    .eq("id", poolId)
    .single();
  if (poolError || !pool) return { error: "Pool not found." };

  const { data: guesses, error: guessesError } = await supabase
    .from("guesses")
    .select("id, payment_id, payment_status")
    .eq("pool_id", poolId);
  if (guessesError) {
    return { error: `Could not load guesses: ${guessesError.message}` };
  }

  const paid = (guesses ?? []).filter(
    (g) => g.payment_status === "paid" && g.payment_id
  );

  let refunded = 0;
  const failures: string[] = [];
  for (const guess of paid) {
    try {
      await getStripe().refunds.create({
        payment_intent: guess.payment_id!,
        refund_application_fee: true,
      });
      refunded++;
    } catch (err) {
      console.error(`Refund failed for guess ${guess.id}:`, err);
      failures.push(guess.id);
    }
  }

  if (failures.length > 0) {
    return {
      error: `Aborted: ${failures.length} of ${paid.length} refunds failed (guess ids: ${failures.join(", ")}). Pool was NOT deleted — retry or refund manually in Stripe first.`,
      refunded,
      refundFailures: failures.length,
    };
  }

  const { error: deleteError } = await supabase
    .from("pools")
    .delete()
    .eq("id", poolId);
  if (deleteError) return { error: `Delete failed: ${deleteError.message}` };

  revalidatePath("/");
  revalidatePath("/guesses");
  revalidatePath("/admin");
  return {
    success: `Deleted pool "${pool.baby_name ?? pool.slug}" (${(guesses ?? []).length} guesses removed, ${refunded} refunded).`,
    refunded,
  };
}
