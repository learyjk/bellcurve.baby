import { notFound } from "next/navigation";
import { BabyPoolClient } from "@/components/ui/baby/BabyPoolClient";
import { getGuessesForPool } from "@/lib/data/guesses/getGuessesForPool";
import { getPoolBySlug } from "@/lib/data/pool/getPoolBySlug";
import LockedPoolDisplay from "./locked-pool-display";
import { createClient } from "@/lib/supabase/server";

export default async function BabyPoolPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ payment?: string }>;
}) {
  const { slug } = await params;
  const { payment } = await searchParams;
  const pool = await getPoolBySlug(slug);

  if (!pool) {
    return notFound();
  }

  const guesses = await getGuessesForPool(pool.id);

  // Get user on server side
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (pool.is_locked) {
    return <LockedPoolDisplay pool={pool} guesses={guesses} />;
  }

  return (
    <div className="w-full max-w-6xl mx-auto rounded-xl px-4 py-12">
      <BabyPoolClient
        pool={pool}
        guesses={guesses}
        user={user}
        paymentStatus={payment}
      />
    </div>
  );
}
