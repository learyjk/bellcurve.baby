import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ClosePoolForm from "./close-pool-form";
import { getPoolBySlug } from "@/lib/data/pool/getPoolBySlug";

export default async function ClosePoolPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.log("NO USER", user);
    return notFound();
  }

  const pool = await getPoolBySlug(params.slug);
  console.log("USER", user);
  console.log("POOL", pool);

  if (!pool || pool.user_id !== user.id) {
    return notFound();
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-20 items-center">
      <div className="animate-in flex-1 flex flex-col gap-20 max-w-4xl px-3">
        <main className="flex-1 flex flex-col gap-6">
          <h2 className="font-bold text-4xl mb-4">Close Pool</h2>
          <ClosePoolForm pool={pool} />
        </main>
      </div>
    </div>
  );
}
