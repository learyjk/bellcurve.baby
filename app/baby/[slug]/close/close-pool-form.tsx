"use client";
import { Tables } from "@/database.types";
import { closePool, ClosePoolState } from "@/lib/actions/baby/closePool";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ClosePoolForm({ pool }: { pool: Tables<"pools"> }) {
  const initialState: ClosePoolState = { message: null };
  const [state, formAction] = useActionState(closePool, initialState);

  useEffect(() => {
    if (state.message) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-8">
      <div>
        <Label htmlFor="actual_birth_date">Actual Birth Date</Label>
        <Input
          type="date"
          id="actual_birth_date"
          name="actual_birth_date"
          required
        />
      </div>
      <div>
        <Label htmlFor="actual_birth_weight">Actual Birth Weight (lbs)</Label>
        <Input
          type="number"
          id="actual_birth_weight"
          name="actual_birth_weight"
          step="0.01"
          required
        />
      </div>
      <input type="hidden" name="pool_id" value={pool.id} />
      <Button type="submit">Close Pool</Button>
    </form>
  );
}
