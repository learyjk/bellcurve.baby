import { createClient } from "@/lib/supabase/server";
import { Tables } from "@/database.types";

export async function getGuessesForPool(
  poolId: string,
  opts: { includeRefunded?: boolean } = {}
): Promise<Tables<"guesses">[]> {
  const supabase = await createClient();
  let query = supabase
    .from("guesses")
    .select("*")
    .eq("pool_id", poolId)
    .order("created_at", { ascending: false });

  // By default, refunded guesses don't count — a refunded donation isn't a
  // donation. Ranking (closePool) and all public views exclude them. The
  // pool page passes includeRefunded so the owner can see the audit trail.
  if (!opts.includeRefunded) {
    query = query.neq("payment_status", "refunded");
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching guesses:", error);
    return [];
  }
  return data as Tables<"guesses">[];
}
