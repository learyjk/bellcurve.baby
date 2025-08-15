"use client";

import { useState, useEffect, useActionState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Tables } from "@/database.types";
import { GuessSliders } from "@/components/ui/baby/guess-sliders";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/app/baby/data-table";
import { guessColumns } from "@/app/baby/[slug]/columns";
import { getGuessPrice } from "@/lib/helpers/pricing";
import { loadStripe } from "@stripe/stripe-js";
import { toast } from "sonner";
import {
  createCheckoutSession,
  CreateCheckoutSessionState,
} from "@/lib/actions/baby/createCheckoutSession";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import Image from "next/image";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export function BabyPoolClient({
  pool,
  guesses,
}: {
  pool: Tables<"pools">;
  guesses: Tables<"guesses">[];
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

  const initialState: CreateCheckoutSessionState = {};
  const [state, formAction, isPending] = useActionState(
    createCheckoutSession,
    initialState
  );

  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
    }
    if (state.sessionId) {
      const handleRedirect = async () => {
        const stripe = await stripePromise;
        if (stripe) {
          await stripe.redirectToCheckout({ sessionId: state.sessionId! });
        } else {
          toast.error("Stripe.js has not loaded yet.");
        }
      };
      handleRedirect();
    }
  }, [state]);

  // Helper to validate and build payload for formAction
  const getGuessPayload = () => {
    if (!pool.mu_due_date) {
      toast.error("Error: Due date is not set for this pool.");
      return null;
    }
    const [year, month, day] = pool.mu_due_date.split("-").map(Number);
    const dueDate = new Date(year, month - 1, day);
    const guessDate = new Date(dueDate);
    guessDate.setDate(guessDate.getDate() + birthDateDeviation);
    return {
      poolId: pool.id,
      slug: pool.slug,
      guessDate: guessDate.toISOString(),
      guessWeight: weightGuessOunces,
      price: totalPrice,
      babyName: pool.baby_name || "the baby",
      name,
    };
  };

  const { totalPrice, datePrice, weightPrice } = getGuessPrice({
    pool,
    birthDateDeviation,
    // For pricing, use ounces directly
    weightGuess: weightGuessOunces,
  });

  // Calculate total donations from all guesses
  const totalDonations = guesses.reduce(
    (sum, guess) => sum + (guess.calculated_price || 0),
    0
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-24">
      {/* Left Column - Content Area */}
      <div className="space-y-6">
        <div>
          <h2 className="text-4xl text-pretty font-semibold tracking-tight mb-1">
            Guess and donate on {pool.baby_name || "the Baby"}&apos;s Arrival!
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Organized by {pool.organized_by}
          </p>
          {/* Image */}
          {pool.image_url && (
            <div className="relative w-32 mb-4 max-w-32 bg-white p-2 shadow-lg transform rotate-6 overflow-hidden">
              <div className="relative w-full h-24 overflow-hidden">
                <Image
                  src={pool.image_url}
                  alt={
                    pool.baby_name
                      ? `${pool.baby_name} pool`
                      : "Baby pool image"
                  }
                  fill
                  className="object-cover"
                  sizes="128px"
                  priority
                />
              </div>
            </div>
          )}
          {/* <p className="text-muted-foreground">
            Expected due date:{" "}
            {pool.mu_due_date
              ? (() => {
                  const [year, month, day] = (pool.mu_due_date as string)
                    .split("-")
                    .map(Number);
                  return new Date(year, month - 1, day).toLocaleDateString();
                })()
              : "Not set"}
          </p> */}
        </div>

        {/* Description */}
        {pool.description && (
          <p className="text-muted-foreground leading-relaxed">
            {pool.description}
          </p>
        )}

        {/* Data Table */}
        <div>
          <h2 className="text-xl font-bold mb-4 text-center">
            Previous Donations
          </h2>
          {guesses.length === 0 ? (
            <div className="text-center text-gray-500 py-8 text-lg">
              No results - be the first!
            </div>
          ) : (
            <DataTable columns={guessColumns} data={guesses} />
          )}
        </div>
      </div>

      {/* Right Column - Sticky Sidebar */}
      <div className="lg:sticky lg:top-4 lg:h-fit">
        <Card>
          <CardContent className="p-4 space-y-6">
            {/* Show sum of all donations */}
            <div>
              <div className="font-cherry-bomb text-5xl mb-1">
                {`$${totalDonations.toFixed(0)} donated`}
              </div>
              <div className="text-sm text-muted-foreground">
                {guesses.length} donation{guesses.length !== 1 ? "s" : ""}
              </div>
            </div>
            <form
              className="mb-0"
              action={async () => {
                const payload = getGuessPayload();
                if (payload) await formAction(payload);
              }}
            >
              <div className="">
                <GuessSliders
                  birthDateDeviation={birthDateDeviation}
                  weightGuessOunces={weightGuessOunces}
                  onValueChange={handleGuessChange}
                  pool={pool}
                  layout="vertical"
                />
              </div>
              <div className="mt-4">
                <Card className="bg-primary-foreground shadow-none">
                  <CardContent className="p-6 text-center">
                    <div className="text-sm font-mono font-bold tracking-widest uppercase mb-2">
                      Total Guess Price
                    </div>
                    <div className="font-cherry-bomb text-5xl mb-2 text-foreground">
                      ${totalPrice.toFixed(2)}
                    </div>
                    <div className="flex justify-center items-start gap-2">
                      <div className="flex flex-col items-end font-mono space-y-1 text-xs text-muted-foreground">
                        <span>Date price:</span>
                        <span>Weight price:</span>
                      </div>
                      <div className="flex flex-col items-start font-mono space-y-1 text-xs text-muted-foreground">
                        <span>${datePrice.toFixed(2)}</span>
                        <span>${weightPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="text-center mt-4">
                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full h-12 text-lg flex items-center justify-center"
                >
                  {isPending ? (
                    <>
                      <LoadingSpinner />
                      Processing...
                    </>
                  ) : (
                    `Place Guess for $${totalPrice.toFixed(2)}`
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
