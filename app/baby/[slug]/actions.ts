"use server";

import { createClient } from "@/lib/supabase/server";
import { getBetPrice } from "@/lib/bets/getBetPrice";
import { Tables, TablesInsert } from "@/database.types";
import { revalidatePath } from "next/cache";

export async function submitGuess(data: {
  pool: Tables<"pools">;
  birthDateDeviation: number;
  weightGuess: number;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to submit a guess." };
  }

  if (!data.pool.due_date) {
    return { error: "This pool does not have a due date set." };
  }

  const dueDate = new Date(data.pool.due_date);
  const guessedBirthDate = new Date(dueDate);
  guessedBirthDate.setDate(
    guessedBirthDate.getDate() + data.birthDateDeviation
  );

  const calculatedPrice = getBetPrice({
    dayOffset: data.birthDateDeviation,
    weightLbs: data.weightGuess,
    muWeight: data.pool.mu_weight ?? 7.6,
    sigmaWeight: data.pool.sigma_weight ?? 0.75,
    sigmaDay: data.pool.sigma_days ?? 5,
    basePrice: data.pool.price_floor ?? 5,
    maxPremium: (data.pool.price_ceiling ?? 25) - (data.pool.price_floor ?? 5),
  });

  const betData: TablesInsert<"bets"> = {
    pool_id: data.pool.id,
    user_id: user.id,
    guessed_birth_date: guessedBirthDate.toISOString(),
    guessed_weight: data.weightGuess,
    calculated_price: calculatedPrice,
    payment_status: "unpaid",
    payment_id: "5576e000-ccac-421e-b397-f098df0f80d6",
  };

  console.log("Submitting bet data:", betData);

  const { error } = await supabase.from("bets").insert(betData);

  if (error) {
    console.error(error);
    return { error: "There was an error submitting your guess." };
  }

  revalidatePath(`/baby/${data.pool.slug}`);

  return { success: true };
}
