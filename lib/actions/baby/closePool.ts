"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getBetsForPool } from "@/lib/data/bets/getBetsForPool";
import { rankBetsByAccuracy } from "@/lib/helpers/ranking";

export type ClosePoolState = {
  message: string | null;
  errors?: Record<string, string[]>;
};

export async function closePool(
  prevState: ClosePoolState,
  formData: FormData
): Promise<ClosePoolState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      message: "User not authenticated",
    };
  }

  const values = {
    actual_birth_date: formData.get("actual_birth_date") as string,
    actual_birth_weight: parseFloat(
      formData.get("actual_birth_weight") as string
    ),
    pool_id: formData.get("pool_id") as string,
  };

  if (!values.actual_birth_date || !values.actual_birth_weight) {
    return {
      message: "Actual birth date and weight are required.",
    };
  }

  const { data: pool } = await supabase
    .from("pools")
    .select("*")
    .eq("id", values.pool_id)
    .single();

  if (!pool || pool.user_id !== user.id) {
    return { message: "Pool not found or user not authorized" };
  }

  const bets = await getBetsForPool(values.pool_id);

  if (!bets) {
    return { message: "No bets found for this pool" };
  }

  const guesses = bets.map((bet) => ({
    name: bet.name || "",
    guessDate: bet.guessed_birth_date,
    guessWeight: bet.guessed_weight,
    bet_id: bet.id,
  }));

  const rankedBets = rankBetsByAccuracy(guesses, {
    actualBirthDate: values.actual_birth_date,
    actualWeight: values.actual_birth_weight,
  });

  const rankingsToInsert = rankedBets.map((bet, index) => ({
    pool_id: values.pool_id,
    bet_id: bet.bet_id,
    rank: index + 1,
    distance: bet.distance,
  }));

  const { error: rankingsError } = await supabase
    .from("rankings")
    .insert(rankingsToInsert);

  if (rankingsError) {
    console.error("Error saving rankings:", rankingsError);
    return { message: "Failed to save rankings" };
  }

  const { error } = await supabase
    .from("pools")
    .update({
      actual_birth_date: values.actual_birth_date,
      actual_birth_weight: values.actual_birth_weight,
      is_locked: true,
    })
    .eq("id", values.pool_id);

  if (error) {
    console.error("Error closing pool:", error);
    return { message: "Failed to close pool" };
  }

  revalidatePath(`/baby/${pool.slug}`);
  return { message: null, errors: {} };
}
