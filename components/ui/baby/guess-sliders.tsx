"use client";
import { Slider } from "@/components/ui/slider";
import { getBetPrice } from "@/lib/data/bets/getBetPrice";
import { getBetPriceFromPool } from "@/lib/data/bets/getBetPriceFromPool";
import { GaussianCurve } from "@/components/ui/baby/gaussian-curve";
import { Tables } from "@/database.types";

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
  // Use the pool's mean weight if available, otherwise default to 7.6
  const meanWeight = pool?.mu_weight ?? 7.6;
  const weightMin = meanWeight - 2;
  const weightMax = meanWeight + 2;

  // Calculate price using pool configuration if available, otherwise use legacy function
  const price = pool
    ? getBetPriceFromPool({
        dayOffset: birthDateDeviation,
        weightLbs: weightGuess,
        pool,
      })
    : getBetPrice({
        dayOffset: birthDateDeviation,
        weightLbs: weightGuess,
      });

  // Calculate individual prices for date and weight
  const datePrice = pool
    ? getBetPriceFromPool({
        dayOffset: birthDateDeviation,
        weightLbs: meanWeight,
        pool,
      })
    : getBetPrice({ dayOffset: birthDateDeviation, weightLbs: meanWeight });
  const weightPrice = pool
    ? getBetPriceFromPool({ dayOffset: 0, weightLbs: weightGuess, pool })
    : getBetPrice({ dayOffset: 0, weightLbs: weightGuess });

  // Use the pool's sigma for weight, or default to 0.7
  const sigmaWeight = pool?.sigma_weight ?? 0.7;
  // Use the same range for the curve and slider for clarity
  const weightCurveMin = weightMin;
  const weightCurveMax = weightMax;
  const weightCurveSigma = sigmaWeight;

  // Calculate the base price (both at mean)
  const basePrice = pool
    ? getBetPriceFromPool({ dayOffset: 0, weightLbs: meanWeight, pool })
    : getBetPrice({ dayOffset: 0, weightLbs: meanWeight });
  // Date contribution: price(date deviation, mean weight) - base
  const dateContribution =
    (pool
      ? getBetPriceFromPool({
          dayOffset: birthDateDeviation,
          weightLbs: meanWeight,
          pool,
        })
      : getBetPrice({ dayOffset: birthDateDeviation, weightLbs: meanWeight })) -
    basePrice;
  // Weight contribution: price(mean date, weight deviation) - base
  const weightContribution =
    (pool
      ? getBetPriceFromPool({ dayOffset: 0, weightLbs: weightGuess, pool })
      : getBetPrice({ dayOffset: 0, weightLbs: weightGuess })) - basePrice;

  return (
    <>
      {/* Sliders Side by Side */}
      <div className="flex flex-col md:flex-row gap-8 mt-6">
        {/* Birth Date Guess Slider with Gaussian Curve */}
        <div className="flex-1">
          <label
            htmlFor="birth_date_deviation"
            className="block font-medium mb-4"
          >
            Birth Date Guess (days from due date)
          </label>
          <div className="mb-4 flex justify-center">
            <GaussianCurve
              currentGuess={birthDateDeviation}
              min={-14}
              max={14}
              width={300}
              height={120}
              sigma={pool?.sigma_days ?? 5}
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
            <span>-14</span>
            <span>0</span>
            <span>+14</span>
          </div>
          <div className="text-sm text-center" id="birth_date_deviation_value">
            {birthDateDeviation} days
          </div>
          <div className="text-xs text-center mt-2 text-blue-700">
            Date Contribution:{" "}
            <span className="font-semibold">
              ${dateContribution.toFixed(2)}
            </span>
          </div>
        </div>
        {/* Weight Guess Slider with Gaussian Curve */}
        <div className="flex-1">
          <label htmlFor="weight_guess" className="block font-medium mb-4">
            Birth Weight Guess (lbs)
          </label>
          <div className="mb-4 flex justify-center">
            <GaussianCurve
              currentGuess={weightGuess}
              min={weightCurveMin}
              max={weightCurveMax}
              width={300}
              height={120}
              sigma={weightCurveSigma}
            />
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
            <span className="font-semibold">
              ${weightContribution.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
      {/* Display calculated total price */}
      <div className="mt-8 text-center">
        <span className="font-semibold">Base Price:</span> $
        {basePrice.toFixed(2)}
        <br />
        <span className="font-semibold">Total Bet Price:</span> ${price}
      </div>
    </>
  );
}
