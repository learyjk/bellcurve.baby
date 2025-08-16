"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getGuessesForPool } from "@/lib/data/guesses/getGuessesForPool";
import { rankGuessesByAccuracy } from "@/lib/helpers/ranking";

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
      formData.get("actual_birth_weight_ounces") as string
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

  const guesses = await getGuessesForPool(values.pool_id);

  if (!guesses) {
    return { message: "No guesses found for this pool" };
  }

  const formattedGuesses = guesses.map((guess) => ({
    name: guess.name || "",
    guessDate: guess.guessed_birth_date,
    guessWeight: guess.guessed_weight,
    guess_id: guess.id,
  }));

  const rankedGuesses = rankGuessesByAccuracy(formattedGuesses, {
    actualBirthDate: values.actual_birth_date,
    actualWeight: values.actual_birth_weight,
  });

  const rankingsToInsert = rankedGuesses.map((guess, index) => ({
    pool_id: values.pool_id,
    guess_id: guess.guess_id,
    rank: index + 1,
    distance: guess.distance,
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
      actual_birth_weight: values.actual_birth_weight / 16, // convert oz to lbs
      is_locked: true,
    })
    .eq("id", values.pool_id);

  if (error) {
    console.error("Error closing pool:", error);
    return { message: `Failed to close pool: ${error.message}` };
  }

  revalidatePath(`/baby/${pool.slug}`);
  return { message: null, errors: {} };
}
