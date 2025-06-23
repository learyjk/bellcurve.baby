
import {
	Card,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { CreateBabyPoolForm } from "@/components/ui/baby/create-form";

export const metadata = {
  title: 'Create Your Baby Pool',
};

export default function CreateBabyPoolPage() {
	return (
		<div className="flex justify-center items-center min-h-[60vh]">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Create a Baby Pool</CardTitle>
				</CardHeader>
				<CreateBabyPoolForm />
			</Card>
		</div>
	);
}