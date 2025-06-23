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

export function CreateBabyPoolForm() {
	const initialState: CreatePoolState = { message: null, errors: {} };
	const [state, formAction] = useActionState(createPool, initialState);

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
				{/* Birth Date Guess Slider */}
				<div>
					<Label htmlFor="birth_date_deviation">Birth Date Guess (days from due date)</Label>
					<input
						id="birth_date_deviation"
						name="birth_date_deviation"
						type="range"
						min="-14"
						max="14"
						defaultValue="0"
						step="1"
						className="w-full"
						onInput={e => {
							const label = document.getElementById('birth_date_deviation_value');
							if (label) label.textContent = e.currentTarget.value + ' days';
						}}
					/>
					<div className="text-xs text-gray-600 flex justify-between">
						<span>-14</span>
						<span>0</span>
						<span>+14</span>
					</div>
					<div id="birth_date_deviation_value" className="text-sm text-center">0 days</div>
				</div>
				
				{state.message && (
					<div className="text-red-500 text-sm">{state.message}</div>
				)}
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
