import { createClient } from "@/lib/supabase/server";
import { DataTable } from "@/app/baby/data-table";
import { betColumns } from "../columns";
import { notFound } from "next/navigation";
import { Tables } from "@/database.types";

export default async function ViewGuessesPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = await createClient();
  const { data: pool, error: poolError } = await supabase
    .from("pools")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (poolError || !pool) notFound();

  const { data: bets, error: betsError } = await supabase
    .from("bets")
    .select("*")
    .eq("pool_id", pool.id)
    .order("created_at", { ascending: false });

  if (betsError) notFound();

  // Calculate total pool amount
  const totalPool = (bets || []).reduce(
    (sum, bet) => sum + (bet.calculated_price || 0),
    0
  );

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Guesses for {pool.baby_name || "the baby"}
      </h1>
      <div className="text-center mb-6">
        <span className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full font-semibold text-lg">
          Total Pool: ${totalPool.toFixed(2)}
        </span>
      </div>
      <DataTable columns={betColumns} data={bets as Tables<"bets">[]} />
    </div>
  );
}
