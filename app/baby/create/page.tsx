import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateBabyPoolForm } from "@/components/ui/baby/create-form";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { hasFeatureAccess } from "@/lib/features";
import { FEATURES } from "@/lib/features/types";

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

  // Check if user has access to create baby pools
  const hasAccess = await hasFeatureAccess(user.id, FEATURES.CREATE_BABY_POOL);
  
  if (!hasAccess) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl tracking-tighter">
              Feature Not Available
            </CardTitle>
          </CardHeader>
          <div className="p-6">
            <p className="text-muted-foreground mb-4">
              You don&apos;t have access to create baby pools yet. This feature is currently in beta.
            </p>
            <p className="text-sm text-muted-foreground">
              If you&apos;d like access to this feature, please contact the administrator.
            </p>
          </div>
        </Card>
      </div>
    );
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
