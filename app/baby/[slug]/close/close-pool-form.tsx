"use client";
import { Tables } from "@/database.types";
import { closePool, ClosePoolState } from "@/lib/actions/baby/closePool";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LiveRankingsTable } from "./live-rankings-table";

export default function ClosePoolForm({
  pool,
  bets,
}: {
  pool: Tables<"pools">;
  bets: Tables<"bets">[];
}) {
  const initialState: ClosePoolState = { message: null };
  const [state, formAction] = useActionState(closePool, initialState);
  const [actualBirthDate, setActualBirthDate] = useState("");
  const [actualBirthWeight, setActualBirthWeight] = useState<string>("");

  useEffect(() => {
    if (state.message) {
      toast.error(state.message);
    }
  }, [state]);

  const safeBets = bets.map((bet) => ({
    nickname: bet.nickname || "Anonymous",
    guessed_birth_date: bet.guessed_birth_date,
    guessed_weight: bet.guessed_weight,
  }));

  return (
    <>
      <form action={formAction} className="space-y-8">
        <div>
          <Label htmlFor="actual_birth_date">Actual Birth Date</Label>
          <Input
            type="date"
            id="actual_birth_date"
            name="actual_birth_date"
            required
            value={actualBirthDate}
            onChange={(e) => setActualBirthDate(e.target.value)}
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
            value={actualBirthWeight}
            onChange={(e) => setActualBirthWeight(e.target.value)}
          />
        </div>
        <input type="hidden" name="pool_id" value={pool.id} />
        <Button type="submit">Close Pool</Button>
      </form>
      <LiveRankingsTable
        bets={safeBets}
        actualBirthDate={actualBirthDate}
        actualBirthWeight={
          actualBirthWeight === "" ? undefined : Number(actualBirthWeight)
        }
      />
    </>
  );
}
