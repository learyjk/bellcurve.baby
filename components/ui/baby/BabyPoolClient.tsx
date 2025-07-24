"use client";

import { useState, useEffect, useActionState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Tables } from "@/database.types";
import { GuessSliders } from "@/components/ui/baby/guess-sliders";
import { Button } from "@/components/ui/button";
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

  return (
    <div>
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold">
          Make you guess for {pool.baby_name || "the Baby"}&apos;s Arrival!
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
        {/* Descrition */}
        {pool.description && (
          <p className="text-muted-foreground mt-2">{pool.description}</p>
        )}
        {/* Image */}
        {pool.image_url && (
          <div className="flex justify-center my-4">
            <div className="relative w-[200px] h-[200px] rounded shadow border overflow-hidden">
              <Image
                src={pool.image_url}
                alt={
                  pool.baby_name ? `${pool.baby_name} pool` : "Baby pool image"
                }
                fill
                className="object-cover"
                sizes="200px"
                priority
              />
            </div>
          </div>
        )}
      </div>
      <form
        className="mb-0"
        action={async () => {
          const payload = getGuessPayload();
          if (payload) await formAction(payload);
        }}
      >
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
              Total Guess Price
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
      <div className="mt-12">
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
  );
}
