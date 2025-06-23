"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	CardContent,
	CardFooter,
} from "@/components/ui/card";
import { useActionState } from "react";
import { createPool, CreatePoolState } from "@/app/baby/create/actions";
import { toast } from "sonner"
import { useEffect } from "react";

export function CreateBabyPoolForm() {
	const initialState: CreatePoolState = { message: null, errors: {} };
	const [state, formAction] = useActionState(createPool, initialState);

	useEffect(() => {
		if (state.message) {
			toast.error(state.message);
		} else if (state.message === null && Object.keys(state.errors ?? {}).length === 0) {
			toast.success("Pool created successfully!");
		}
	}, [state]);

	return (
		<form action={formAction}>
			<CardContent className="space-y-4">
				<div>
					<Label htmlFor="baby_name">Baby Name</Label>
					<Input
						id="baby_name"
						name="baby_name"
						defaultValue=""
						placeholder="e.g. Baby Smith"
						required
					/>
				</div>
				<div>
					<Label htmlFor="due_date">Due Date</Label>
					<Input
						id="due_date"
						name="due_date"
						type="date"
						defaultValue=""
						required
					/>
				</div>
				<div>
					<Label htmlFor="slug">Pool Slug</Label>
					<Input
						id="slug"
						name="slug"
						defaultValue=""
						placeholder="e.g. smith-family-2025"
						required
					/>
				</div>
				
			</CardContent>
			<CardFooter>
				<Button
					type="submit"
					className="w-full"
				>
					Create Pool
				</Button>
			</CardFooter>
		</form>
	);
}
