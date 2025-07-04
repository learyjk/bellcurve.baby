"use client";

import { useState, useTransition, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Tables } from "@/database.types";
import { GuessSliders } from "@/components/ui/baby/guess-sliders";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/app/baby/data-table";
import { betColumns } from "./columns";
import { getBetPrice } from "@/lib/helpers/pricing";
import { loadStripe } from "@stripe/stripe-js";
import { toast } from "sonner";
import { createCheckoutSession } from "@/lib/actions/baby/createCheckoutSession";

export function BabyPoolClient({
  pool,
  bets,
}: {
  pool: Tables<"pools">;
  bets: Tables<"bets">[];
}) {
  const [nickname, setNickname] = useState<string>("");
  useEffect(() => {
    async function fetchUserName() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && user.user_metadata?.name) {
        setNickname(user.user_metadata.name);
      }
    }
    fetchUserName();
  }, []);
  const stripePromise = loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
  );
  const [birthDateDeviation, setBirthDateDeviation] = useState(0);
  const [weightGuess, setWeightGuess] = useState(pool.mu_weight ?? 7.6);
  const [isPending, startTransition] = useTransition();

  const handleGuessChange = (values: {
    birthDateDeviation?: number;
    weightGuess?: number;
  }) => {
    if (values.birthDateDeviation !== undefined) {
      setBirthDateDeviation(values.birthDateDeviation);
    }
    if (values.weightGuess !== undefined) {
      setWeightGuess(values.weightGuess);
    }
  };

  const handleBet = async () => {
    startTransition(async () => {
      if (!pool.due_date) {
        toast.error("Error: Due date is not set for this pool.");
        return;
      }

      const dueDate = new Date(pool.due_date);
      const guessDate = new Date(dueDate);
      guessDate.setDate(guessDate.getDate() + birthDateDeviation);

      const result = await createCheckoutSession({
        poolId: pool.id,
        slug: pool.slug,
        guessDate: guessDate.toISOString(),
        guessWeight: weightGuess,
        price: totalPrice,
        babyName: pool.baby_name || "the baby",
        nickname,
      });

      if (result.error) {
        toast.error(`Error: ${result.error}`);
        return;
      }

      if (result.sessionId) {
        const stripe = await stripePromise;
        if (stripe) {
          await stripe.redirectToCheckout({ sessionId: result.sessionId });
        } else {
          toast.error("Error: Stripe.js has not loaded yet.");
        }
      }
    });
  };

  const { totalPrice, datePrice, weightPrice } = getBetPrice({
    pool,
    birthDateDeviation,
    weightGuess,
  });

  return (
    <div>
      <div className="mb-8">
        <GuessSliders
          birthDateDeviation={birthDateDeviation}
          weightGuess={weightGuess}
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
          className="w-full h-12 text-lg"
        >
          {isPending
            ? "Redirecting to payment..."
            : `Place Bet for $${totalPrice.toFixed(2)}`}
        </Button>
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-bold mb-4 text-center">Previous Bets</h2>
        <DataTable columns={betColumns} data={bets} />
      </div>
    </div>
  );
}
