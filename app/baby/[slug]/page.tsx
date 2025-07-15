import { notFound } from "next/navigation";
import { BabyPoolClient } from "@/components/ui/baby/BabyPoolClient";
import { getBetsForPool } from "@/lib/data/bets/getBetsForPool";
import { getPoolBySlug } from "@/lib/data/pool/getPoolBySlug";

export default async function BabyPoolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pool = await getPoolBySlug(slug);

  if (!pool) {
    return notFound();
  }

  const bets = await getBetsForPool(pool.id);
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="w-full max-w-4xl mx-auto bg-white border rounded-xl shadow p-8">
        <BabyPoolClient pool={pool} bets={bets} />
      </div>
    </div>
  );
}
