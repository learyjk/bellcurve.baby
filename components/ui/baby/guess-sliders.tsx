"use client";
import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { getBetPrice } from "@/lib/bets/getBetPrice";

export function GuessSliders() {
  const [birthDateDeviation, setBirthDateDeviation] = useState(0);
  const [weightGuess, setWeightGuess] = useState(7.6);

  // Calculate price using getBetPrice
  const price = getBetPrice({
    dayOffset: birthDateDeviation,
    weightLbs: weightGuess,
  });

  return (
    <>
      {/* Birth Date Guess Slider */}
      <div className="mt-6">
        <label htmlFor="birth_date_deviation" className="block font-medium mb-1">
          Birth Date Guess (days from due date)
        </label>
        <Slider
          id="birth_date_deviation"
          name="birth_date_deviation"
          defaultValue={[0]}
          min={-14}
          max={14}
          step={1}
          className="w-full"
          onValueChange={val => setBirthDateDeviation(val[0])}
        />
        <div className="text-xs text-gray-600 flex justify-between">
          <span>-14</span>
          <span>0</span>
          <span>+14</span>
        </div>
        <div className="text-sm text-center" id="birth_date_deviation_value">
          {birthDateDeviation} days
        </div>
      </div>
      {/* Weight Guess Slider */}
      <div className="mt-6">
        <label htmlFor="weight_guess" className="block font-medium mb-1">
          Birth Weight Guess (lbs)
        </label>
        <Slider
          id="weight_guess"
          name="weight_guess"
          defaultValue={[7.6]}
          min={5}
          max={9}
          step={0.1}
          className="w-full"
          onValueChange={val => setWeightGuess(val[0])}
        />
        <div className="text-xs text-gray-600 flex justify-between">
          <span>5</span>
          <span>7.6</span>
          <span>9</span>
        </div>
        <div className="text-sm text-center" id="weight_guess_value">
          {weightGuess} lbs
        </div>
      </div>
      {/* Display calculated price */}
      <div className="mt-6 text-center">
        <span className="font-semibold">Your Bet Price:</span> ${price}
      </div>
    </>
  );
}
