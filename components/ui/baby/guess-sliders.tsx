"use client";
import { Slider } from "@/components/ui/slider";
import { GaussianCurve } from "@/components/ui/baby/gaussian-curve";
import { Tables } from "@/database.types";

export function GuessSliders({
  birthDateDeviation,
  weightGuessOunces,
  onValueChange,
  pool,
}: {
  birthDateDeviation: number;
  weightGuessOunces: number;
  onValueChange: (values: {
    birthDateDeviation?: number;
    weightGuessOunces?: number;
  }) => void;
  pool?: Tables<"pools">;
}) {
  // If backend provides meanWeight in ounces, convert to lbs/oz
  let meanWeightOz = pool?.mu_weight ?? 121.6; // fallback to 7.6 lbs in oz
  if (meanWeightOz < 30) {
    // If value is suspiciously low, assume it's in lbs, convert to oz
    meanWeightOz = meanWeightOz * 16;
  }
  const meanWeightLbs = Math.floor(meanWeightOz / 16);
  const meanWeightRemOz = Math.round(meanWeightOz % 16);
  const meanWeight = meanWeightOz / 16;
  const weightMinOz = Math.floor(meanWeightOz - 32); // +/- 2 lbs
  const weightMaxOz = Math.ceil(meanWeightOz + 32);
  const weightMinLbs = Math.floor(weightMinOz / 16);
  const weightMinRemOz = Math.round(weightMinOz % 16);
  const weightMaxLbs = Math.floor(weightMaxOz / 16);
  const weightMaxRemOz = Math.round(weightMaxOz % 16);

  const currentWeightLbs = Math.floor(weightGuessOunces / 16);
  const currentWeightOz = Math.round(weightGuessOunces % 16);

  // Pricing constants from the pool
  const minBetPrice = pool?.price_floor ?? 5;
  const maxBetPrice = pool?.price_ceiling ?? 50;

  // Each component gets half the price range
  const minComponentPrice = minBetPrice / 2;
  const maxComponentPrice = maxBetPrice / 2;

  // Sigma values from the pool (fallback to defaults if missing)
  const dateSigma = pool?.sigma_days ?? 4;
  const weightSigma = pool?.sigma_weight ?? 0.6;

  const dueDate = pool?.mu_due_date
    ? new Date(`${pool.mu_due_date}T00:00:00`)
    : null;

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
              sigma={dateSigma}
            />
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
        </div>
        {/* Weight Guess Slider */}
        <div className="flex-1">
          <div className="mb-4 flex justify-center">
            <GaussianCurve
              currentGuess={weightGuessOunces / 16}
              mean={meanWeight}
              min={weightMinOz / 16}
              max={weightMaxOz / 16}
              minPrice={minComponentPrice}
              maxPrice={maxComponentPrice}
              title="Birth Weight Probability Distribution"
              minLabel={`${weightMinLbs} lbs ${weightMinRemOz} oz`}
              maxLabel={`${weightMaxLbs} lbs ${weightMaxRemOz} oz`}
              meanLabel={`${meanWeightLbs} lbs ${meanWeightRemOz} oz`}
              sigma={weightSigma}
            />
          </div>
          <Slider
            id="weight_guess_ounces"
            name="weight_guess_ounces"
            defaultValue={[weightGuessOunces]}
            min={weightMinOz}
            max={weightMaxOz}
            step={1}
            className="w-full"
            onValueChange={(val) =>
              onValueChange({ weightGuessOunces: val[0] })
            }
          />
          <div className="text-xs text-gray-600 flex justify-between">
            <span>{`${weightMinLbs} lbs ${weightMinRemOz} oz`}</span>
            <span>{`${meanWeightLbs} lbs ${meanWeightRemOz} oz`}</span>
            <span>{`${weightMaxLbs} lbs ${weightMaxRemOz} oz`}</span>
          </div>
          <div className="text-sm text-center mt-2" id="weight_guess_value">
            {currentWeightLbs} lbs {currentWeightOz} oz
          </div>
        </div>
      </div>
    </>
  );
}
