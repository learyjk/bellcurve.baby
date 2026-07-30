import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateBabyPoolForm } from "@/components/ui/baby/create-form";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Create Your Baby Pool",
};

export default async function CreateBabyPoolPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl tracking-tighter">
            Create Baby Pool
          </CardTitle>
        </CardHeader>
        <CreateBabyPoolForm />
      </Card>
    </div>
  );
}
