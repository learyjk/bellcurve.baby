import { createClient } from "@/lib/supabase/server";
import { Database } from "@/database.types";

export type RankingWithGuess =
  Database["public"]["Tables"]["rankings"]["Row"] & {
    guesses: Database["public"]["Tables"]["guesses"]["Row"] | null;
  };

export async function getRankingsForPool(
  poolId: string
): Promise<RankingWithGuess[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rankings")
    .select("*, guesses(*)")
    .eq("pool_id", poolId)
    .order("rank", { ascending: true });

  if (error) {
    console.error("Error fetching rankings:", error);
    return [];
  }

  return data as RankingWithGuess[];
}
