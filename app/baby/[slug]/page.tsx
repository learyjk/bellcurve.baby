import { createClient } from "@/lib/supabase/server";
import { Tables } from "@/database.types";
import { notFound } from "next/navigation";
import { GuessSliders } from "@/components/ui/baby/guess-sliders";

export default async function BabyPoolPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pools")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (error || !data) {
    notFound();
  }

  const pool = data as Tables<'pools'>;

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 border rounded-lg bg-white shadow">
      <h1 className="text-2xl font-bold mb-2">{pool.baby_name || "Baby Pool"}</h1>
      <div className="text-gray-700 mb-1">
        <span className="font-semibold">Due Date:</span> {pool.due_date || "TBD"}
      </div>
      <div className="text-gray-700 mb-1">
        <span className="font-semibold">Created By:</span> {pool.user_id}
      </div>
      <div className="text-gray-700 mb-1">
        <span className="font-semibold">Slug:</span> {pool.slug}
      </div>
      {pool.price_floor !== null && pool.price_ceiling !== null && (
        <div className="text-gray-700 mb-1">
          <span className="font-semibold">Price Range:</span> ${pool.price_floor} - ${pool.price_ceiling}
        </div>
      )}
      {pool.mu_weight !== null && pool.sigma_weight !== null && (
        <div className="text-gray-700 mb-1">
          <span className="font-semibold">Weight Distribution:</span> μ={pool.mu_weight}, σ={pool.sigma_weight}
        </div>
      )}
      {pool.sigma_days !== null && (
        <div className="text-gray-700 mb-1">
          <span className="font-semibold">Due Date Std Dev (days):</span> {pool.sigma_days}
        </div>
      )}
      {pool.actual_birth_date && (
        <div className="text-gray-700 mb-1">
          <span className="font-semibold">Actual Birth Date:</span> {pool.actual_birth_date}
        </div>
      )}
      {pool.actual_birth_weight && (
        <div className="text-gray-700 mb-1">
          <span className="font-semibold">Actual Birth Weight:</span> {pool.actual_birth_weight} g
        </div>
      )}
      {/* Guess Sliders (Client Component) */}
      <GuessSliders />
    </div>
  );
}
