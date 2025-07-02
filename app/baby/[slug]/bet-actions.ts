import { createClient } from "@/lib/supabase/server";
import { Tables } from "@/database.types";

export async function getBetsForPool(
  poolId: string
): Promise<Tables<"bets">[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bets")
    .select("*")
    .eq("pool_id", poolId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Error fetching bets:", error);
    return [];
  }
  return data as Tables<"bets">[];
}
