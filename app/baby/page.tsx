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
    <div className="max-w-4xl mx-auto mt-10 p-4">
      <h1 className="text-2xl font-bold mb-4">My Babies</h1>
      {data.length > 0 ? (
        <DataTable columns={columns} data={data} />
      ) : (
        <p className="text-muted-foreground">
          You have not created any baby pools yet.
        </p>
      )}
    </div>
  );
}
