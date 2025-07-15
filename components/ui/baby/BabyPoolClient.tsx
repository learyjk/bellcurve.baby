"use client";

import { useState, useTransition, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Tables } from "@/database.types";
import { GuessSliders } from "@/components/ui/baby/guess-sliders";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/app/baby/data-table";
import { betColumns } from "@/app/baby/[slug]/columns";
import { getBetPrice } from "@/lib/helpers/pricing";
import { loadStripe } from "@stripe/stripe-js";
import { toast } from "sonner";
import { createCheckoutSession } from "@/lib/actions/baby/createCheckoutSession";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export function BabyPoolClient({
  pool,
  bets,
}: {
  pool: Tables<"pools">;
  bets: Tables<"bets">[];
}) {
  const [name, setName] = useState<string>("");
  useEffect(() => {
    async function fetchUserName() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && user.user_metadata?.display_name) {
        setName(user.user_metadata.display_name);
      }
    }
    fetchUserName();
  }, []);

  const [birthDateDeviation, setBirthDateDeviation] = useState(0);

  // mu_weight is in ounces, e.g. 121.6 for 7.6 lbs
  const initialWeightInOz = pool.mu_weight ?? 121.6;

  const [weightGuessOunces, setWeightGuessOunces] = useState(initialWeightInOz);

  // Always keep ounces version for backend
  const [isPending, startTransition] = useTransition();
  const [loadingStep, setLoadingStep] = useState<string | null>(null);

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

  const handleBet = async () => {
    startTransition(async () => {
      setLoadingStep("Creating checkout session...");
      if (!pool.mu_due_date) {
        toast.error("Error: Due date is not set for this pool.");
        setLoadingStep(null);
        return;
      }

      const [year, month, day] = pool.mu_due_date.split("-").map(Number);
      const dueDate = new Date(year, month - 1, day);
      const guessDate = new Date(dueDate);
      guessDate.setDate(guessDate.getDate() + birthDateDeviation);

      const result = await createCheckoutSession({
        poolId: pool.id,
        slug: pool.slug,
        guessDate: guessDate.toISOString(),
        guessWeight: weightGuessOunces,
        price: totalPrice,
        babyName: pool.baby_name || "the baby",
        name,
      });

      if (result.error) {
        toast.error(`Error: ${result.error}`);
        setLoadingStep(null);
        return;
      }

      setLoadingStep("Loading payment gateway...");
      if (result.sessionId) {
        const stripe = await stripePromise;
        if (stripe) {
          setLoadingStep("Redirecting to Stripe...");
          await stripe.redirectToCheckout({ sessionId: result.sessionId });
        } else {
          toast.error("Error: Stripe.js has not loaded yet.");
          setLoadingStep(null);
        }
      } else {
        setLoadingStep(null);
      }
    });
  };

  const { totalPrice, datePrice, weightPrice } = getBetPrice({
    pool,
    birthDateDeviation,
    // For pricing, convert ounces to decimal lbs
    weightGuess: weightGuessOunces / 16,
  });

  return (
    <div>
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold">
          Bet on {pool.baby_name || "the Baby"}&apos;s Arrival!
        </h2>
        <p className="text-muted-foreground">
          Expected due date:{" "}
          {pool.mu_due_date
            ? (() => {
                const [year, month, day] = (pool.mu_due_date as string)
                  .split("-")
                  .map(Number);
                return new Date(year, month - 1, day).toLocaleDateString();
              })()
            : "Not set"}
        </p>
      </div>
      <div className="mb-8">
        <GuessSliders
          birthDateDeviation={birthDateDeviation}
          weightGuessOunces={weightGuessOunces}
          onValueChange={handleGuessChange}
          pool={pool}
        />
      </div>
      <div className="mb-8">
        <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl text-center border border-blue-200 shadow">
          <div className="text-lg font-semibold text-gray-700 mb-2">
            Total Bet Price
          </div>
          <div className="text-3xl font-bold text-blue-600 mb-2">
            ${totalPrice.toFixed(2)}
          </div>
          <div className="flex justify-center space-x-4 text-sm text-gray-600">
            <span>Date price: ${datePrice.toFixed(2)}</span>
            <span>Weight price: ${weightPrice.toFixed(2)}</span>
          </div>
          <div className="text-sm text-gray-600">
            Based on your current guess
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Button
          onClick={handleBet}
          disabled={isPending}
          className="w-full h-12 text-lg flex items-center justify-center"
        >
          {isPending ? (
            <>
              <svg
                className="animate-spin mr-2 h-5 w-5 text-blue-600 inline-block"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                ></path>
              </svg>
              {loadingStep || "Processing..."}
            </>
          ) : (
            `Place Bet for $${totalPrice.toFixed(2)}`
          )}
        </Button>
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-bold mb-4 text-center">
          Previous Donations
        </h2>
        {bets.length === 0 ? (
          <div className="text-center text-gray-500 py-8 text-lg">
            No results - be the first!
          </div>
        ) : (
          <DataTable columns={betColumns} data={bets} />
        )}
      </div>
    </div>
  );
}
