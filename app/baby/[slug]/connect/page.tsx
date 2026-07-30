import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPoolBySlug } from "@/lib/data/pool/getPoolBySlug";
import ConnectStripeClient from "./connect-stripe-client";

export default async function ConnectStripePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { slug } = await params;
  const { status } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const pool = await getPoolBySlug(slug);
  if (!pool) return notFound();

  // Only the pool owner can access this page
  if (pool.user_id !== user.id) return notFound();

  return (
    <div className="container mx-auto py-12 px-4 max-w-lg">
      <ConnectStripeClient
        poolId={pool.id}
        poolSlug={pool.slug}
        babyName={pool.baby_name ?? "your baby"}
        isConnected={pool.stripe_onboarding_complete}
        status={status}
      />
    </div>
  );
}
