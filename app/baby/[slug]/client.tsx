"use client";

import { useState, useTransition } from "react";
import { Tables } from "@/database.types";
import { GuessSliders } from "@/components/ui/baby/guess-sliders";
import { BabyGuessVisual } from "@/components/ui/baby/baby-guess-visual";
import { Button } from "@/components/ui/button";
import { submitGuess } from "./actions";

export function BabyPoolClient({ pool }: { pool: Tables<'pools'> }) {
  const [birthDateDeviation, setBirthDateDeviation] = useState(0);
  const [weightGuess, setWeightGuess] = useState(7.6);
  const [isPending, startTransition] = useTransition();

  const handleGuessChange = (values: { birthDateDeviation?: number; weightGuess?: number }) => {
    if (values.birthDateDeviation !== undefined) {
      setBirthDateDeviation(values.birthDateDeviation);
    }
    if (values.weightGuess !== undefined) {
      setWeightGuess(values.weightGuess);
    }
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await submitGuess({ pool, birthDateDeviation, weightGuess });
      if (result?.error) {
        alert(result.error);
      } else {
        alert("Guess submitted successfully!");
      }
    });
  };

  return (
    <>
      {/* Guess Sliders (Client Component) */}
      <GuessSliders
        birthDateDeviation={birthDateDeviation}
        weightGuess={weightGuess}
        onValueChange={handleGuessChange}
      />
      <div className="mt-6 text-center">
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending ? "Submitting..." : "Submit Guess"}
        </Button>
      </div>
      {/* Visual */}
      <BabyGuessVisual
        pool={pool}
        birthDateDeviation={birthDateDeviation}
        weightGuess={weightGuess}
      />
    </>
  );
}
