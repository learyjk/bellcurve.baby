import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { getPoolBySlug } from "@/lib/data/pool/getPoolBySlug";
import { EditPoolForm } from "./edit-pool-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Edit Baby Pool",
};

export default async function EditBabyPoolPage({
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
    redirect(`/auth/login?next=/baby/${slug}/edit`);
  }

  const pool = await getPoolBySlug(slug);

  // Only the owner may edit; behave like a 404 for anyone else.
  if (!pool || String(pool.user_id).trim() !== String(user.id).trim()) {
    return notFound();
  }

  if (pool.is_locked) {
    redirect(`/baby/${slug}`);
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl tracking-tighter">
            Edit Baby Pool
          </CardTitle>
          <Link
            href={`/baby/${slug}`}
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to pool
          </Link>
          <p className="text-sm text-muted-foreground">
            Pricing settings (price range and pricing model) can&apos;t be
            changed after creation, to keep things fair for existing guesses.
          </p>
        </CardHeader>
        <EditPoolForm pool={pool} />
      </Card>
    </div>
  );
}
