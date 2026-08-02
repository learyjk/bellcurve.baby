import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminCleanupClient } from "./AdminCleanupClient";

export const metadata = { title: "Cleanup - Admin" };

export default async function AdminCleanupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/admin/cleanup");
  }

  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (!allowed.includes(user.email?.toLowerCase() ?? "")) {
    notFound();
  }

  // Service-role reads: RLS would limit these lists to what the admin's
  // own policies allow; cleanup needs the full picture.
  const admin = createAdminClient();

  const { data: pools } = await admin
    .from("pools")
    .select("id, slug, baby_name, created_at, user_id")
    .order("created_at", { ascending: false });

  const { data: usersData } = await admin.auth.admin.listUsers({
    perPage: 200,
  });
  const users = (usersData?.users ?? []).map((u) => ({
    id: u.id,
    email: u.email ?? "(no email)",
    created_at: u.created_at,
  }));

  const poolOwnerCount = new Map<string, number>();
  for (const p of pools ?? []) {
    poolOwnerCount.set(p.user_id, (poolOwnerCount.get(p.user_id) ?? 0) + 1);
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 px-4 py-12">
      <h1 className="font-cherry-bomb text-3xl md:text-6xl font-bold text-pretty text-center tracking-wide mb-4">
        Test Data Cleanup
      </h1>
      <p className="text-center text-muted-foreground mb-8">
        Deleting a pool refunds its paid guesses first, then removes the pool,
        guesses, and rankings. Deleting a user does the same for every pool
        they own, then removes the auth account. This cannot be undone.
      </p>
      <AdminCleanupClient
        pools={(pools ?? []).map((p) => ({
          id: p.id,
          slug: p.slug,
          babyName: p.baby_name,
          createdAt: p.created_at,
          ownerId: p.user_id,
        }))}
        users={users}
        poolCountByOwner={Object.fromEntries(poolOwnerCount)}
        currentUserId={user.id}
      />
    </div>
  );
}
