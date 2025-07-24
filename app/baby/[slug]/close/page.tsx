import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ClosePoolForm from "./close-pool-form";
import { getPoolBySlug } from "@/lib/data/pool/getPoolBySlug";
import { getGuessesForPool } from "@/lib/data/guesses/getGuessesForPool";

export default async function ClosePoolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return notFound();
  }

  const pool = await getPoolBySlug(slug);

  if (!pool || String(pool.user_id).trim() !== String(user.id).trim()) {
    console.log("POOL USER ID MISMATCH", pool?.user_id, user.id);
    return notFound();
  }

  const guesses = await getGuessesForPool(pool.id);

  return (
    <div className="flex-1 w-full flex flex-col gap-20 items-center">
      <div className="animate-in flex-1 flex flex-col gap-20 max-w-4xl px-3">
        <main className="flex-1 flex flex-col gap-6">
          <h2 className="font-bold text-4xl mb-4">Close Pool</h2>
          <ClosePoolForm pool={pool} guesses={guesses} />
        </main>
      </div>
    </div>
  );
}
