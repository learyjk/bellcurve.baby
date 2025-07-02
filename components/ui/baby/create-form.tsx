"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CardContent, CardFooter } from "@/components/ui/card";
import { useActionState } from "react";
import { createPool, CreatePoolState } from "@/app/baby/create/actions";
import { toast } from "sonner";
import { useEffect } from "react";

export function CreateBabyPoolForm() {
  const initialState: CreatePoolState = { message: null, errors: {} };
  const [state, formAction] = useActionState(createPool, initialState);

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
                step="0.01"
                defaultValue="5"
                placeholder="5.00"
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
                step="0.01"
                defaultValue="50"
                placeholder="50.00"
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
      </CardContent>
      <CardFooter className="p-8 pt-0">
        <Button type="submit" className="w-full h-12 text-lg">
          Create Pool
        </Button>
      </CardFooter>
    </form>
  );
}
