import { createClient } from "@/lib/supabase/server";
import { Tables } from "@/database.types";
import { notFound } from "next/navigation";
import { BabyPoolClient } from "./client";

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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="w-full max-w-4xl mx-auto bg-white border rounded-xl shadow p-8">
        <h1 className="text-3xl font-bold mb-4">
          {pool.baby_name || "Baby Pool"}
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <div className="text-gray-700">
              <span className="font-semibold">Due Date:</span>{" "}
              {pool.due_date || "TBD"}
            </div>
            <div className="text-gray-700">
              <span className="font-semibold">Created By:</span> {pool.user_id}
            </div>
            <div className="text-gray-700">
              <span className="font-semibold">Slug:</span> {pool.slug}
            </div>
            {pool.price_floor !== null && pool.price_ceiling !== null && (
              <div className="text-gray-700">
                <span className="font-semibold">Price Range:</span> $
                {pool.price_floor} - ${pool.price_ceiling}
              </div>
            )}
            {pool.mu_weight !== null && pool.sigma_weight !== null && (
              <div className="text-gray-700">
                <span className="font-semibold">Weight Distribution:</span> μ=
                {pool.mu_weight}, σ={pool.sigma_weight}
              </div>
            )}
            {pool.sigma_days !== null && (
              <div className="text-gray-700">
                <span className="font-semibold">Due Date Std Dev (days):</span>{" "}
                {pool.sigma_days}
              </div>
            )}
            {pool.actual_birth_date && (
              <div className="text-gray-700">
                <span className="font-semibold">Actual Birth Date:</span>{" "}
                {pool.actual_birth_date}
              </div>
            )}
            {pool.actual_birth_weight && (
              <div className="text-gray-700">
                <span className="font-semibold">Actual Birth Weight:</span>{" "}
                {pool.actual_birth_weight} g
              </div>
            )}
          </div>
        </div>
        <BabyPoolClient pool={pool} />
      </div>
    </div>
  );
}
