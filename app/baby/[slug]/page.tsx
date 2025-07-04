import { createClient } from "@/lib/supabase/server";
import { Tables } from "@/database.types";
import { notFound } from "next/navigation";
import { BabyPoolClient } from "./client";
import { getBetsForPool } from "@/lib/data/bets/getBetsForPool";

export default async function BabyPoolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pools")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    notFound();
  }

  const pool = data as Tables<"pools">;

  const bets = await getBetsForPool(pool.id);
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="w-full max-w-4xl mx-auto bg-white border rounded-xl shadow p-8">
        <h1 className="text-3xl font-bold mb-4">
          {pool.baby_name || "Baby Pool"}
        </h1>
        <BabyPoolClient pool={pool} bets={bets} />
      </div>
    </div>
  );
}
