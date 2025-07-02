"use client";

import { useState, useTransition } from "react";
import { Tables } from "@/database.types";
import { GuessSliders } from "@/components/ui/baby/guess-sliders";
import { Button } from "@/components/ui/button";
import { submitGuess } from "./actions";
import { getBetPrice } from "@/lib/helpers/pricing";

export function BabyPoolClient({ pool }: { pool: Tables<"pools"> }) {
  const [birthDateDeviation, setBirthDateDeviation] = useState(0);
  const [weightGuess, setWeightGuess] = useState(pool.mu_weight ?? 7.6);
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

  const { totalPrice, datePrice, weightPrice } = getBetPrice({
    pool,
    birthDateDeviation,
    weightGuess,
  });

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <GuessSliders
          birthDateDeviation={birthDateDeviation}
          weightGuess={weightGuess}
          onValueChange={handleGuessChange}
          pool={pool}
        />
      </div>
      <div className="mb-8">
        <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl text-center border border-blue-200 shadow">
          <div className="text-lg font-semibold text-gray-700 mb-2">
            Total Bet Price
          </div>
          <div className="text-3xl font-bold text-blue-600 mb-2">
            ${totalPrice.toFixed(2)}
          </div>
          <div className="flex justify-center space-x-4 text-sm text-gray-600">
            <span>Date price: ${datePrice.toFixed(2)}</span>
            <span>Weight price: ${weightPrice.toFixed(2)}</span>
          </div>
          <div className="text-sm text-gray-600">
            Based on your current guess
          </div>
        </div>
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
    </div>
  );
}
