import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateBabyPoolForm } from "@/components/ui/baby/create-form";

export const metadata = {
  title: "Create Your Baby Pool",
};

export default function CreateBabyPoolPage() {
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
