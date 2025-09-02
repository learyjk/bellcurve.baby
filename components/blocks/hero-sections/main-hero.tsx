"use client";

import React, { useState } from "react";
import { GuessSliders } from "@/components/ui/baby/guess-sliders";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getGuessPrice } from "@/lib/helpers/pricing";
import { Tables } from "@/database.types";
import { pricingModelSigmas } from "@/lib/helpers/pricingModels";

// Minimal, presentational hero demonstrating the guessing UI.
export default function MainHero() {
  // local state for demo sliders
  const muWeight = 7.4;
  // demo due date = today + 9 months (YYYY-MM-DD)
  const demoDue = new Date();
  demoDue.setMonth(demoDue.getMonth() + 2);
  const muDateStr = demoDue.toISOString().slice(0, 10);
  const demoPool: Tables<"pools"> = {
    // minimal shape used by GuessSliders and pricing for demo purposes
    mu_weight: muWeight * 16,
    mu_due_date: muDateStr,
    price_floor: 10,
    price_ceiling: 100,
    actual_birth_date: null,
    actual_birth_weight: null,
    baby_name: null,
    created_at: null,
    description: "",
    id: "demo-pool-id",
    image_url: null,
    organized_by: null,
    organizer_image_url: null,
    sigma_days: pricingModelSigmas.standard.dateSigma,
    sigma_weight: pricingModelSigmas.standard.weightSigma,
    is_locked: null,
    slug: "demo",
    user_id: "demo-user-id",
  };
  const [birthDateDeviation, setBirthDateDeviation] = useState(0);
  const initialWeightInOz = demoPool.mu_weight ?? 118.4;
  const [weightGuessOunces, setWeightGuessOunces] = useState(initialWeightInOz);

  const handleGuessChange = (values: {
    birthDateDeviation?: number;
    weightGuessOunces?: number;
  }) => {
    if (values.birthDateDeviation !== undefined) {
      setBirthDateDeviation(values.birthDateDeviation);
    }
    if (values.weightGuessOunces !== undefined) {
      setWeightGuessOunces(values.weightGuessOunces);
    }
  };

  return (
    <section className="w-full max-w-4xl mx-auto px-4 py-12">
      <div className="flex flex-col gap-2 items-center">
        <h1 className="text-3xl md:text-6xl font-bold tracking-tighter text-pretty text-center mb-4">
          Collect donations and celebrate your newborn with a fun guessing game.
        </h1>
        <p className="text-lg text-muted-foreground text-center max-w-2xl mb-2">
          Create a pool for your baby and invite your friends and family to
          guess the birth date and weight. The person who guesses closest wins a
          prize determined by the pool creator.
        </p>

        <GuessSliders
          birthDateDeviation={birthDateDeviation}
          weightGuessOunces={weightGuessOunces}
          onValueChange={handleGuessChange}
          pool={demoPool}
        />

        <div />
        <Card className="shadow-none w-full max-w-sm">
          <CardContent className="p-6 text-center">
            <div className="text-sm font-mono font-bold tracking-widest uppercase mb-2">
              Total Guess Price
            </div>
            <div className="font-cherry-bomb text-5xl mb-2 text-foreground">
              {(() => {
                try {
                  const { totalPrice } = getGuessPrice({
                    pool: demoPool,
                    birthDateDeviation,
                    weightGuess: weightGuessOunces,
                  });
                  return `$${totalPrice.toFixed(2)}`;
                } catch {
                  return "$100.00";
                }
              })()}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center w-full">
              <Button asChild className="w-full">
                <Link href="/auth/sign-up">Sign up & create pool</Link>
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link href="/auth/login">Login and guess</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
