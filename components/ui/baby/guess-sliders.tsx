"use client";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { GaussianCurve } from "@/components/ui/baby/gaussian-curve";
import { Tables } from "@/database.types";
import { DATE_DEVIATION_DAYS, WEIGHT_DEVIATION_OUNCES } from "@/lib/constants";
import { pricingModelSigmas } from "@/lib/helpers/pricingModels";
import { getGuessComponentPrice } from "@/lib/helpers/pricing";
import FatBaby from "@/app/assets/FatBaby";
import ThinBaby from "@/app/assets/ThinBaby";
import Bread from "@/app/assets/Bread";
import Toast from "@/app/assets/Toast";

export function GuessSliders({
  birthDateDeviation,
  weightGuessOunces,
  onValueChange,
  pool,
  layout = "adaptive",
}: {
  birthDateDeviation: number;
  weightGuessOunces: number;
  onValueChange: (values: {
    birthDateDeviation?: number;
    weightGuessOunces?: number;
  }) => void;
  pool?: Tables<"pools">;
  layout?: "horizontal" | "vertical" | "adaptive";
}) {
  // If backend provides meanWeight in ounces, convert to lbs/oz
  let meanWeightOz = pool?.mu_weight ?? 121.6; // fallback to 7.6 lbs in oz
  if (meanWeightOz < 30) {
    // If value is suspiciously low, assume it's in lbs, convert to oz
    meanWeightOz = meanWeightOz * 16;
  }
  const meanWeightLbs = Math.floor(meanWeightOz / 16);
  const meanWeightRemOz = Math.round(meanWeightOz % 16);
  const weightMinOz = Math.floor(meanWeightOz - WEIGHT_DEVIATION_OUNCES);
  const weightMaxOz = Math.ceil(meanWeightOz + WEIGHT_DEVIATION_OUNCES);
  const weightMinLbs = Math.floor(weightMinOz / 16);
  const weightMinRemOz = Math.round(weightMinOz % 16);
  const weightMaxLbs = Math.floor(weightMaxOz / 16);
  const weightMaxRemOz = Math.round(weightMaxOz % 16);

  const currentWeightLbs = Math.floor(weightGuessOunces / 16);
  const currentWeightOz = Math.round(weightGuessOunces % 16);

  // Pricing constants from the pool
  const minGuessPrice = pool?.price_floor ?? 5;
  const maxGuessPrice = pool?.price_ceiling ?? 50;

  // Each component gets half the price range
  const minComponentPrice = minGuessPrice / 2;
  const maxComponentPrice = maxGuessPrice / 2;

  // Sigma values from the pool (fallback to defaults if missing)
  const dateSigma = pool?.sigma_days ?? pricingModelSigmas.standard.dateSigma;
  const weightSigma =
    pool?.sigma_weight ?? pricingModelSigmas.standard.weightSigma;

  const dueDate = pool?.mu_due_date
    ? new Date(`${pool.mu_due_date}T00:00:00`)
    : null;

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const minDate = dueDate ? new Date(dueDate.getTime()) : null;
  if (minDate) minDate.setDate(minDate.getDate() - DATE_DEVIATION_DAYS);

  const maxDate = dueDate ? new Date(dueDate.getTime()) : null;
  if (maxDate) maxDate.setDate(maxDate.getDate() + DATE_DEVIATION_DAYS);

  const currentGuessDate = dueDate ? new Date(dueDate.getTime()) : null;
  if (currentGuessDate)
    currentGuessDate.setDate(currentGuessDate.getDate() + birthDateDeviation);

  const minDateLabel = formatDate(minDate);
  const maxDateLabel = formatDate(maxDate);
  const meanDateLabel = formatDate(dueDate);
  const currentGuessDateLabel = formatDate(currentGuessDate);

  // Precompute component prices so GaussianCurve and total match exactly
  const dateComponentPrice = getGuessComponentPrice({
    guess: birthDateDeviation,
    mean: 0,
    bound: DATE_DEVIATION_DAYS,
    minPrice: minComponentPrice,
    maxPrice: maxComponentPrice,
    sigma: dateSigma,
  });

  const weightComponentPrice = getGuessComponentPrice({
    guess: weightGuessOunces,
    mean: meanWeightOz,
    bound: WEIGHT_DEVIATION_OUNCES,
    minPrice: minComponentPrice,
    maxPrice: maxComponentPrice,
    sigma: weightSigma * 16, // convert sigma from lbs to oz
  });

  // Determine the layout classes based on the layout prop
  const getLayoutClasses = () => {
    switch (layout) {
      case "horizontal":
        return "flex flex-row gap-4";
      case "vertical":
        return "flex flex-col gap-4";
      case "adaptive":
      default:
        // Adaptive: vertical on small screens, horizontal on medium and up
        // Use xl breakpoint for horizontal to ensure enough space for side-by-side curves
        return "flex flex-col xl:flex-row gap-4";
    }
  };

  return (
    <div className="font-mono">
      {/* Sliders with Dynamic Layout */}
      <div className={`${getLayoutClasses()}`}>
        {/* Birth Date Guess Slider with Gaussian Curve */}
        <div className="flex-0">
          <Card className="shadow-none w-full max-w-sm">
            <CardContent className="pt-4 px-4 pb-10">
              <div className="mb-4 flex justify-center">
                <GaussianCurve
                  currentGuess={birthDateDeviation}
                  mean={0}
                  min={-DATE_DEVIATION_DAYS}
                  max={DATE_DEVIATION_DAYS}
                  minPrice={minComponentPrice}
                  maxPrice={maxComponentPrice}
                  title="Date Price Curve"
                  minLabel={minDateLabel}
                  meanLabel={meanDateLabel}
                  maxLabel={maxDateLabel}
                  sigma={dateSigma}
                  computedPrice={dateComponentPrice}
                  width={280}
                  height={120}
                  tooltipText="Mean is the due date. +/- 3 weeks captures ~99% of births. All guessed dates are interpreted in Pacific Time (PT)."
                />
              </div>
              <div className="relative">
                <Slider
                  id="birth_date_deviation"
                  name="birth_date_deviation"
                  defaultValue={[birthDateDeviation]}
                  min={-DATE_DEVIATION_DAYS}
                  max={DATE_DEVIATION_DAYS}
                  step={1}
                  className="w-full"
                  onValueChange={(val) =>
                    onValueChange({ birthDateDeviation: val[0] })
                  }
                  minImage={<Bread width={22} height={22} />}
                  maxImage={<Toast width={22} height={22} />}
                />
                <div
                  className="absolute mt-2 text-xs font-mono transform -translate-x-1/2 text-center whitespace-nowrap bg-card px-2 py-1 border rounded"
                  style={{
                    left: `${
                      ((birthDateDeviation - -DATE_DEVIATION_DAYS) /
                        (DATE_DEVIATION_DAYS - -DATE_DEVIATION_DAYS)) *
                      100
                    }%`,
                  }}
                  id="birth_date_deviation_value"
                >
                  {currentGuessDateLabel}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Weight Guess Slider */}
        <div className="flex-0">
          <Card className="shadow-none w-full max-w-sm">
            <CardContent className="pt-4 px-4 pb-10">
              <div className="mb-4 flex justify-center">
                <GaussianCurve
                  currentGuess={weightGuessOunces}
                  mean={meanWeightOz}
                  min={weightMinOz}
                  max={weightMaxOz}
                  minPrice={minComponentPrice}
                  maxPrice={maxComponentPrice}
                  title="Weight Price Curve"
                  minLabel={`${weightMinLbs} lbs ${weightMinRemOz} oz`}
                  maxLabel={`${weightMaxLbs} lbs ${weightMaxRemOz} oz`}
                  meanLabel={`${meanWeightLbs} lbs ${meanWeightRemOz} oz`}
                  sigma={weightSigma * 16} // convert sigma from lbs to oz
                  computedPrice={weightComponentPrice}
                  width={280}
                  height={120}
                  tooltipText="In USA, 7 lbs 6 oz is the mean for boys. 7 lbs 2 oz is the mean for girls."
                />
              </div>
              <div className="relative">
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
                  minImage={<ThinBaby width={22} height={22} />}
                  maxImage={<FatBaby width={22} height={22} />}
                />
                <div
                  className="absolute mt-2 text-xs font-mono transform -translate-x-1/2 text-center whitespace-nowrap bg-card px-2 py-1 border rounded"
                  style={{
                    left: `${
                      ((weightGuessOunces - weightMinOz) /
                        (weightMaxOz - weightMinOz)) *
                      100
                    }%`,
                  }}
                  id="weight_guess_value"
                >
                  {currentWeightLbs} lbs {currentWeightOz} oz
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
