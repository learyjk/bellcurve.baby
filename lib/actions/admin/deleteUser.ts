"use server";

import { revalidatePath } from "next/cache";
import Stripe from "stripe";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export type AdminDeleteUserResult = {
  error?: string;
  success?: string;
  refunded?: number;
  poolsDeleted?: number;
};

/**
 * Admin-only full user deletion, Stripe-first:
 *   1. Find every pool the user owns and every paid guess on those pools.
 *   2. Refund all paid guesses (refund_application_fee: true).
 *   3. Delete the auth user via the admin API — pools, guesses, and
 *      rankings cascade via FK (migration 006).
 * If any refund fails, nothing is deleted.
 */
export async function adminDeleteUser(
  userId: string
): Promise<AdminDeleteUserResult> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Not authorized." };

  if (admin.id === userId) {
    return { error: "You can't delete your own account from here." };
  }

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Admin client unavailable.",
    };
  }

  const { data: target } = await supabase.auth.admin.getUserById(userId);
  if (!target?.user) return { error: "User not found." };

  const { data: pools, error: poolsError } = await supabase
    .from("pools")
    .select("id")
    .eq("user_id", userId);
  if (poolsError) {
    return { error: `Could not load pools: ${poolsError.message}` };
  }

  const poolIds = (pools ?? []).map((p) => p.id);

  // Paid guesses on the user's pools (need refunds before deletion).
  let paid: { id: string; payment_id: string | null }[] = [];
  if (poolIds.length > 0) {
    const { data: guesses, error: guessesError } = await supabase
      .from("guesses")
      .select("id, payment_id")
      .in("pool_id", poolIds)
      .eq("payment_status", "paid");
    if (guessesError) {
      return { error: `Could not load guesses: ${guessesError.message}` };
    }
    paid = (guesses ?? []).filter((g) => g.payment_id);
  }

  // Also refund the user's own paid guesses on OTHER people's pools.
  const { data: ownPaid, error: ownPaidError } = await supabase
    .from("guesses")
    .select("id, payment_id")
    .eq("user_id", userId)
    .eq("payment_status", "paid");
  if (ownPaidError) {
    return { error: `Could not load user guesses: ${ownPaidError.message}` };
  }
  const seen = new Set(paid.map((g) => g.id));
  for (const g of ownPaid ?? []) {
    if (g.payment_id && !seen.has(g.id)) paid.push(g);
  }

  let refunded = 0;
  const failures: string[] = [];
  for (const guess of paid) {
    try {
      await stripe.refunds.create({
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
      error: `Aborted: ${failures.length} of ${paid.length} refunds failed (guess ids: ${failures.join(", ")}). User was NOT deleted — retry or refund manually in Stripe first.`,
      refunded,
    };
  }

  // Deleting the auth user cascades: pools -> guesses -> rankings (006).
  const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
  if (deleteError) return { error: `Delete failed: ${deleteError.message}` };

  revalidatePath("/");
  revalidatePath("/guesses");
  revalidatePath("/admin");
  return {
    success: `Deleted user ${target.user.email ?? userId}: ${poolIds.length} pools removed, ${refunded} guesses refunded.`,
    refunded,
    poolsDeleted: poolIds.length,
  };
}
