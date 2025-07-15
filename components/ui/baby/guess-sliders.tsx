"use client";
import { Slider } from "@/components/ui/slider";
import { GaussianCurve } from "@/components/ui/baby/gaussian-curve";
import { Tables } from "@/database.types";

export function GuessSliders({
  birthDateDeviation,
  weightGuessLbs,
  weightGuessOz,
  onValueChange,
  pool,
}: {
  birthDateDeviation: number;
  weightGuessLbs: number;
  weightGuessOz: number;
  onValueChange: (values: {
    birthDateDeviation?: number;
    weightGuessLbs?: number;
    weightGuessOz?: number;
  }) => void;
  pool?: Tables<"pools">;
}) {
  const meanWeight = pool?.mu_weight ?? 7.6;
  const weightMinLbs = Math.floor(meanWeight - 2);
  const weightMaxLbs = Math.ceil(meanWeight + 2);

  // Pricing constants from the pool
  const minBetPrice = pool?.price_floor ?? 5;
  const maxBetPrice = pool?.price_ceiling ?? 50;

  // Each component gets half the price range
  const minComponentPrice = minBetPrice / 2;
  const maxComponentPrice = maxBetPrice / 2;

  // Sigma values from the pool (fallback to defaults if missing)
  const dateSigma = pool?.sigma_days ?? 4;
  const weightSigma = pool?.sigma_weight ?? 0.6;

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
        {/* Weight Guess Inputs for lbs and oz */}
        <div className="flex-1">
          <div className="mb-4 flex justify-center">
            <GaussianCurve
              currentGuess={weightGuessLbs + weightGuessOz / 16}
              mean={meanWeight}
              min={weightMinLbs}
              max={weightMaxLbs}
              minPrice={minComponentPrice}
              maxPrice={maxComponentPrice}
              title="Birth Weight Probability Distribution"
              minLabel={`${weightMinLbs} lbs`}
              maxLabel={`${weightMaxLbs} lbs`}
              meanLabel={`${meanWeight.toFixed(1)} lbs`}
              sigma={weightSigma}
            />
          </div>
          <div className="flex gap-4 items-center justify-center">
            <div>
              <label
                htmlFor="weight_guess_lbs"
                className="block text-xs text-gray-600 mb-1"
              >
                Pounds (lbs)
              </label>
              <input
                id="weight_guess_lbs"
                type="number"
                min={weightMinLbs}
                max={weightMaxLbs}
                value={weightGuessLbs}
                onChange={(e) =>
                  onValueChange({
                    weightGuessLbs: Math.max(
                      weightMinLbs,
                      Math.min(weightMaxLbs, Number(e.target.value))
                    ),
                  })
                }
                className="w-16 px-2 py-1 border rounded text-center"
              />
            </div>
            <div>
              <label
                htmlFor="weight_guess_oz"
                className="block text-xs text-gray-600 mb-1"
              >
                Ounces (oz)
              </label>
              <input
                id="weight_guess_oz"
                type="number"
                min={0}
                max={15}
                value={weightGuessOz}
                onChange={(e) =>
                  onValueChange({
                    weightGuessOz: Math.max(
                      0,
                      Math.min(15, Number(e.target.value))
                    ),
                  })
                }
                className="w-16 px-2 py-1 border rounded text-center"
              />
            </div>
          </div>
          <div className="text-sm text-center mt-2" id="weight_guess_value">
            {weightGuessLbs} lbs {weightGuessOz} oz
          </div>
        </div>
      </div>
    </>
  );
}
