import { createClient } from "@/lib/supabase/server";

export async function getPoolBySlug(slug: string) {
  const supabase = await createClient();
  const { data: pool, error } = await supabase
    .from("pools")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("Error fetching pool by slug:", error);
    return null;
  }

  return pool;
}
