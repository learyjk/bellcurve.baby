import { createClient } from "@/lib/supabase/server";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import { Tables } from "@/database.types";

export const metadata = {
  title: "My Babies - Create Your Baby Pool",
};

async function getBabies(): Promise<Tables<"pools">[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data } = await supabase
    .from("pools")
    .select("*")
    .eq("user_id", user.id);

  return data || [];
}

export default async function BabyPage() {
  const data = await getBabies();

  return (
    <div className="container max-w-3xl  mx-auto py-10">
      <DataTable columns={columns} data={data} />
    </div>
  );
}
