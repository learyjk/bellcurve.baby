"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CardContent, CardFooter } from "@/components/ui/card";
import { useActionState, useState } from "react";
import { createPool, CreatePoolState } from "@/app/baby/create/actions";
import { toast } from "sonner";
import { useEffect } from "react";
import { PricingStyleSelector } from "@/components/ui/baby/pricing-style-selector";
import { PricingStyle } from "@/lib/helpers";

export function CreateBabyPoolForm() {
  const initialState: CreatePoolState = { message: null, errors: {} };
  const [state, formAction] = useActionState(createPool, initialState);
  const [pricingStyle, setPricingStyle] = useState<PricingStyle>("BALANCED");
  const [minPrice, setMinPrice] = useState(5);
  const [maxPrice, setMaxPrice] = useState(25);

  useEffect(() => {
    if (state.message) {
      toast.error(state.message);
    } else if (
      state.message === null &&
      Object.keys(state.errors ?? {}).length === 0
    ) {
      toast.success("Pool created successfully!");
    }
  }, [state]);

  return (
    <form action={formAction}>
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

        {/* Price Range Configuration */}
        <div className="space-y-6 pt-6 border-t border-gray-200">
          <div>
            <h3 className="text-xl font-semibold">
              Betting Price Configuration
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Set the price range and style for your betting pool
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
                step="0.01"
                value={minPrice}
                onChange={(e) => setMinPrice(Number(e.target.value))}
                placeholder="5.00"
                required
                className="mt-2"
              />
              <p className="text-sm text-gray-500 mt-2">
                Price for bets ±14 days from due date
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
                step="0.01"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                placeholder="25.00"
                required
                className="mt-2"
              />
              <p className="text-sm text-gray-500 mt-2">
                Price for betting on exact due date
              </p>
            </div>
          </div>

          {/* Pricing Style Selector */}
          <PricingStyleSelector
            selectedStyle={pricingStyle}
            onStyleChange={setPricingStyle}
            minPrice={minPrice}
            maxPrice={maxPrice}
          />
        </div>
      </CardContent>
      <CardFooter className="p-8 pt-0">
        <Button type="submit" className="w-full h-12 text-lg">
          Create Pool
        </Button>
      </CardFooter>
    </form>
  );
}
