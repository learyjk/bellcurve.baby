"use client";
import { Slider } from "@/components/ui/slider";
import { GaussianCurve } from "@/components/ui/baby/gaussian-curve";
import { Tables } from "@/database.types";
import { getBetComponentPrice } from "@/lib/helpers/pricing";

export function GuessSliders({
  birthDateDeviation,
  weightGuess,
  onValueChange,
  pool,
}: {
  birthDateDeviation: number;
  weightGuess: number;
  onValueChange: (values: {
    birthDateDeviation?: number;
    weightGuess?: number;
  }) => void;
  pool?: Tables<"pools">;
}) {
  const meanWeight = pool?.mu_weight ?? 7.6;
  const weightMin = meanWeight - 2;
  const weightMax = meanWeight + 2;

  // Pricing constants from the pool
  const minBetPrice = pool?.price_floor ?? 5;
  const maxBetPrice = pool?.price_ceiling ?? 50;

  // Each component gets half the price range
  const minComponentPrice = minBetPrice / 2;
  const maxComponentPrice = maxBetPrice / 2;

  const datePrice = getBetComponentPrice({
    guess: birthDateDeviation,
    mean: 0,
    bound: 14,
    minPrice: minComponentPrice,
    maxPrice: maxComponentPrice,
  });

  const weightPrice = getBetComponentPrice({
    guess: weightGuess,
    mean: meanWeight,
    bound: 2,
    minPrice: minComponentPrice,
    maxPrice: maxComponentPrice,
  });

  const dueDate = pool?.due_date ? new Date(`${pool.due_date}T00:00:00`) : null;

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const minDate = dueDate ? new Date(dueDate.getTime()) : null;
  if (minDate) minDate.setDate(minDate.getDate() - 14);

  const maxDate = dueDate ? new Date(dueDate.getTime()) : null;
  if (maxDate) maxDate.setDate(maxDate.getDate() + 14);

  const currentGuessDate = dueDate ? new Date(dueDate.getTime()) : null;
  if (currentGuessDate)
    currentGuessDate.setDate(currentGuessDate.getDate() + birthDateDeviation);

  const minDateLabel = formatDate(minDate);
  const maxDateLabel = formatDate(maxDate);
  const meanDateLabel = formatDate(dueDate);
  const currentGuessDateLabel = formatDate(currentGuessDate);

  return (
    <>
      {/* Sliders Side by Side */}
      <div className="flex flex-col md:flex-row gap-8 mt-6">
        {/* Birth Date Guess Slider with Gaussian Curve */}
        <div className="flex-1">
          <div className="mb-4 flex justify-center">
            <GaussianCurve
              currentGuess={birthDateDeviation}
              mean={0}
              min={-14}
              max={14}
              minPrice={minComponentPrice}
              maxPrice={maxComponentPrice}
              title="Birth Date Probability Distribution"
              minLabel={minDateLabel}
              meanLabel={meanDateLabel}
              maxLabel={maxDateLabel}
            />
          </div>
          <div className="text-center text-lg font-semibold mb-2">
            Date Component Price: ${datePrice.toFixed(2)}
          </div>
          <Slider
            id="birth_date_deviation"
            name="birth_date_deviation"
            defaultValue={[birthDateDeviation]}
            min={-14}
            max={14}
            step={1}
            className="w-full"
            onValueChange={(val) =>
              onValueChange({ birthDateDeviation: val[0] })
            }
          />
          <div className="text-xs text-gray-600 flex justify-between">
            <span>{minDateLabel}</span>
            <span>{meanDateLabel}</span>
            <span>{maxDateLabel}</span>
          </div>
          <div className="text-sm text-center" id="birth_date_deviation_value">
            {currentGuessDateLabel}
          </div>
          <div className="text-xs text-center mt-2 text-blue-700">
            Date Contribution:{" "}
            <span className="font-semibold">${datePrice.toFixed(2)}</span>
          </div>
        </div>
        {/* Weight Guess Slider with Gaussian Curve */}
        <div className="flex-1">
          <div className="mb-4 flex justify-center">
            <GaussianCurve
              currentGuess={weightGuess}
              mean={meanWeight}
              min={weightMin}
              max={weightMax}
              minPrice={minComponentPrice}
              maxPrice={maxComponentPrice}
              title="Birth Weight Probability Distribution"
              minLabel={`${weightMin.toFixed(1)} lbs`}
              maxLabel={`${weightMax.toFixed(1)} lbs`}
              meanLabel={`${meanWeight.toFixed(1)} lbs`}
            />
          </div>
          <div className="text-center text-lg font-semibold mb-2">
            Weight Component Price: ${weightPrice.toFixed(2)}
          </div>
          <Slider
            id="weight_guess"
            name="weight_guess"
            defaultValue={[weightGuess]}
            min={weightMin}
            max={weightMax}
            step={0.1}
            className="w-full"
            onValueChange={(val) => onValueChange({ weightGuess: val[0] })}
          />
          <div className="relative w-full flex justify-between text-xs text-gray-600 mt-1">
            <span>{weightMin}</span>
            <span className="absolute left-1/2 -translate-x-1/2 text-blue-700 font-semibold">
              {meanWeight}
            </span>
            <span>{weightMax}</span>
          </div>
          <div className="text-sm text-center" id="weight_guess_value">
            {weightGuess} lbs
          </div>
          <div className="text-xs text-center mt-2 text-blue-700">
            Weight Contribution:{" "}
            <span className="font-semibold">${weightPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>
      {/* Display calculated total price */}
      <div className="mt-8 text-center">
        <span className="font-semibold">Min Price:</span> $
        {minBetPrice.toFixed(2)}
        <br />
        <span className="font-semibold">Max Bet Price:</span> ${" "}
        {maxBetPrice.toFixed(2)}
      </div>
    </>
  );
}
