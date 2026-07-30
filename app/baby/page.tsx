import { createClient } from "@/lib/supabase/server";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import { Tables } from "@/database.types";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import CryingBaby from "@/app/assets/CryingBaby";

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
    <div className="max-w-4xl mx-auto mt-10 px-4 py-12">
      <h1 className="font-cherry-bomb text-3xl md:text-6xl font-bold text-pretty text-center tracking-wide mb-4">
        My Babies
      </h1>
      {data.length > 0 ? (
        <DataTable columns={columns} data={data} />
      ) : (
        <div className="flex flex-col items-center text-center mt-16 md:mt-24">
          <div className="text-muted-foreground/70 mb-6">
            <CryingBaby width={140} height={140} />
          </div>
          <p className="text-xl text-muted-foreground max-w-md text-pretty">
            No babies yet — this little one is crying out for a pool.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link href="/baby/create">Create your first pool</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
