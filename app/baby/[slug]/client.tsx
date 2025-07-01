"use client";

import { useState, useTransition } from "react";
import { Tables } from "@/database.types";
import { GuessSliders } from "@/components/ui/baby/guess-sliders";
import { BabyGuessVisual } from "@/components/ui/baby/baby-guess-visual";
import { Button } from "@/components/ui/button";
import { submitGuess } from "./actions";
import { getBetPriceFromPool } from "@/lib/data/bets/getBetPriceFromPool";

export function BabyPoolClient({ pool }: { pool: Tables<"pools"> }) {
  const [birthDateDeviation, setBirthDateDeviation] = useState(0);
  const [weightGuess, setWeightGuess] = useState(7.6);
  const [isPending, startTransition] = useTransition();

  const handleGuessChange = (values: {
    birthDateDeviation?: number;
    weightGuess?: number;
  }) => {
    if (values.birthDateDeviation !== undefined) {
      setBirthDateDeviation(values.birthDateDeviation);
    }
    if (values.weightGuess !== undefined) {
      setWeightGuess(values.weightGuess);
    }
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await submitGuess({
        pool,
        birthDateDeviation,
        weightGuess,
      });
      if (result?.error) {
        alert(result.error);
      } else {
        alert("Guess submitted successfully!");
      }
    });
  };

  // Calculate price using pool config
  // (GuessSliders also shows this, but we want a prominent box here)
  const price = getBetPriceFromPool({
    dayOffset: birthDateDeviation,
    weightLbs: weightGuess,
    pool,
  });

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl text-center border border-blue-200 shadow">
          <div className="text-lg font-semibold text-gray-700 mb-2">
            Your Bet Price
          </div>
          <div className="text-3xl font-bold text-blue-600 mb-2">${price}</div>
          <div className="text-sm text-gray-600">
            Based on your current guess
          </div>
        </div>
      </div>

      <div className="mb-8">
        <GuessSliders
          birthDateDeviation={birthDateDeviation}
          weightGuess={weightGuess}
          onValueChange={handleGuessChange}
          pool={pool}
        />
      </div>

      <div className="mt-8 text-center">
        <Button
          onClick={handleSubmit}
          disabled={isPending}
          className="w-full h-12 text-lg"
        >
          {isPending ? "Submitting..." : "Submit My Guess"}
        </Button>
      </div>

      {/* <div className="mt-10">
        <BabyGuessVisual
          pool={pool}
          birthDateDeviation={birthDateDeviation}
          weightGuess={weightGuess}
        />
      </div> */}
    </div>
  );
}
