"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CardContent, CardFooter } from "@/components/ui/card";
import { useActionState } from "react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { GaussianCurve } from "@/components/ui/baby/gaussian-curve";
import { createPool, CreatePoolState } from "@/lib/actions/create/createPool";
import { pricingModelSigmas } from "@/lib/helpers/pricingModels";

export function CreateBabyPoolForm() {
  const initialState: CreatePoolState = { message: null, errors: {} };
  const [state, formAction] = useActionState(createPool, initialState);
  const [submitted, setSubmitted] = useState(false);
  const [pricingModel, setPricingModel] =
    useState<keyof typeof pricingModelSigmas>("standard");
  // Example values for preview
  const birthDateDeviation = 0;
  const weightGuess = 7.6;

  useEffect(() => {
    if (!submitted) return;
    if (state.message) {
      toast.error(state.message);
      setSubmitted(false); // reset after error
    } else if (
      state.message === null &&
      Object.keys(state.errors ?? {}).length === 0
    ) {
      toast.success("Pool created successfully!");
      setSubmitted(false); // reset after success
    }
  }, [state, submitted]);

  function handleSubmit() {
    setSubmitted(true);
    // allow formAction to handle the rest
  }

  const [minPrice, setMinPrice] = useState(5);
  const [maxPrice, setMaxPrice] = useState(50);

  return (
    <form action={formAction} onSubmit={handleSubmit}>
      <CardContent className="space-y-6 p-8">
        <div>
          <Label htmlFor="baby_name">Baby Name</Label>
          <Input
            id="baby_name"
            name="baby_name"
            defaultValue=""
            placeholder="e.g. Baby Smith"
            required
          />
        </div>
        <div>
          <Label htmlFor="due_date">Due Date</Label>
          <Input
            id="due_date"
            name="due_date"
            type="date"
            defaultValue=""
            required
          />
        </div>
        <div>
          <Label htmlFor="slug">Pool Slug</Label>
          <Input
            id="slug"
            name="slug"
            defaultValue=""
            placeholder="e.g. smith-family-2025"
            required
          />
        </div>

        <div>
          <Label htmlFor="mu_weight">Expected Weight (lbs)</Label>
          <Input
            id="mu_weight"
            name="mu_weight"
            type="number"
            step="0.1"
            defaultValue="7.6"
            placeholder="e.g. 7.6"
            required
          />
          <p className="text-sm text-gray-500 mt-2">
            The average or expected birth weight. This will be the peak of the
            weight price distribution.
          </p>
        </div>

        {/* Price Range Configuration */}
        <div className="space-y-6 pt-6 border-t border-gray-200">
          <div>
            <h3 className="text-xl font-semibold">
              Betting Price Configuration
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Set the price range for your betting pool.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="price_floor" className="text-base font-medium">
                Minimum Bet Price ($)
              </Label>
              <Input
                id="price_floor"
                name="price_floor"
                type="number"
                min="1"
                step="1"
                value={minPrice}
                onChange={(e) =>
                  setMinPrice(Math.max(1, Math.floor(Number(e.target.value))))
                }
                placeholder="5"
                required
                className="mt-2"
              />
              <p className="text-sm text-gray-500 mt-2">
                The total price for a bet at the edges of the range (e.g., ±14
                days and ±2 lbs).
              </p>
            </div>
            <div>
              <Label htmlFor="price_ceiling" className="text-base font-medium">
                Maximum Bet Price ($)
              </Label>
              <Input
                id="price_ceiling"
                name="price_ceiling"
                type="number"
                min="1"
                step="1"
                value={maxPrice}
                onChange={(e) =>
                  setMaxPrice(Math.max(1, Math.floor(Number(e.target.value))))
                }
                placeholder="50"
                required
                className="mt-2"
              />
              <p className="text-sm text-gray-500 mt-2">
                The total price for a perfect guess (due date and expected
                weight).
              </p>
            </div>
          </div>
        </div>
        {/* Pricing Model Selection */}
        <div>
          <label className="block font-medium mb-2">
            Select Pricing Model (Sigma Behavior)
          </label>
          <div className="flex gap-4 mb-4">
            <label>
              <input
                type="radio"
                name="pricingModel"
                value="aggressive"
                checked={pricingModel === "aggressive"}
                onChange={() => setPricingModel("aggressive")}
              />
              <span className="ml-1">Aggressive</span>
            </label>
            <label>
              <input
                type="radio"
                name="pricingModel"
                value="standard"
                checked={pricingModel === "standard"}
                onChange={() => setPricingModel("standard")}
              />
              <span className="ml-1">Standard</span>
            </label>
            <label>
              <input
                type="radio"
                name="pricingModel"
                value="chill"
                checked={pricingModel === "chill"}
                onChange={() => setPricingModel("chill")}
              />
              <span className="ml-1">Chill</span>
            </label>
          </div>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <GaussianCurve
                currentGuess={birthDateDeviation}
                mean={0}
                min={-14}
                max={14}
                minPrice={minPrice}
                maxPrice={maxPrice}
                title={`Date Price Curve (${pricingModel})`}
                meanLabel={"Due Date"}
                minLabel={"-14d"}
                maxLabel={"+14d"}
                sigma={pricingModelSigmas[pricingModel].dateSigma}
              />
            </div>
            <div className="flex-1">
              <GaussianCurve
                currentGuess={weightGuess}
                mean={7.6}
                min={5.6}
                max={9.6}
                minPrice={minPrice}
                maxPrice={maxPrice}
                title={`Weight Price Curve (${pricingModel})`}
                meanLabel={"7.6 lbs"}
                minLabel={"5.6 lbs"}
                maxLabel={"9.6 lbs"}
                sigma={pricingModelSigmas[pricingModel].weightSigma}
              />
            </div>
          </div>
        </div>
      </CardContent>
      {/* Hidden input to submit pricing model */}
      <input type="hidden" name="pricingModel" value={pricingModel} />
      <CardFooter className="p-8 pt-0">
        <Button type="submit" className="w-full h-12 text-lg">
          Create Pool
        </Button>
      </CardFooter>
    </form>
  );
}
