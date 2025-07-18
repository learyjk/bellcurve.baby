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
  const [lbs, setLbs] = useState<number | undefined>();
  const [oz, setOz] = useState<number | undefined>();

  useEffect(() => {
    if (state.message) {
      toast.error(state.message);
    }
  }, [state]);

  const actualBirthWeightInOunces =
    lbs !== undefined && oz !== undefined ? lbs * 16 + oz : undefined;

  const safeBets = bets.map((bet) => ({
    name: bet.name || "Anonymous",
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
          <Label>Actual Birth Weight</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              id="actual_birth_weight_lbs"
              name="actual_birth_weight_lbs"
              placeholder="lbs"
              className="w-24"
              value={lbs ?? ""}
              onChange={(e) => setLbs(Number(e.target.value))}
            />
            <Input
              type="number"
              id="actual_birth_weight_oz"
              name="actual_birth_weight_oz"
              placeholder="oz"
              className="w-24"
              value={oz ?? ""}
              onChange={(e) => setOz(Number(e.target.value))}
            />
          </div>
        </div>
        <input
          type="hidden"
          name="actual_birth_weight_ounces"
          value={actualBirthWeightInOunces ?? ""}
        />
        <input type="hidden" name="pool_id" value={pool.id} />
        <Button type="submit">Close Pool</Button>
      </form>
      <LiveRankingsTable
        bets={safeBets}
        actualBirthDate={actualBirthDate}
        actualBirthWeight={actualBirthWeightInOunces}
      />
    </>
  );
}
