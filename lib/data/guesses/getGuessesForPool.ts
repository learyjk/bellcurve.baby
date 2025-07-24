import { createClient } from "@/lib/supabase/server";
import { Tables } from "@/database.types";

export async function getGuessesForPool(
  poolId: string
): Promise<Tables<"guesses">[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("guesses")
    .select("*")
    .eq("pool_id", poolId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Error fetching guesses:", error);
    return [];
  }
  return data as Tables<"guesses">[];
}
