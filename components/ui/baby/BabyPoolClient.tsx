"use client";

import { useState, useEffect, useActionState } from "react";
import { Tables } from "@/database.types";
import { User } from "@supabase/supabase-js";
import { GuessSliders } from "@/components/ui/baby/guess-sliders";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/app/baby/data-table";
import { guessColumns } from "@/app/baby/[slug]/columns";
import { getGuessPrice } from "@/lib/helpers/pricing";
import { loadStripe } from "@stripe/stripe-js";
import { toast } from "sonner";

// Small, dependency-free renderer for basic spacing and simple lists.
// - Preserves paragraphs (double newlines)
// - Preserves single-line breaks inside paragraphs
// - Renders simple ordered (1.) and unordered (-/*) lists
// This keeps things lightweight and avoids adding a Markdown dependency.
function renderDescription(text: string) {
  if (!text) return null;
  const normalized = text.replace(/\r\n/g, "\n");
  const blocks = normalized.split(/\n\s*\n+/);
  return blocks.map((block, bi) => {
    // Fallback: paragraph, keep single newlines as line breaks using whitespace-pre-wrap
    return (
      <p key={bi} className="whitespace-pre-wrap mb-4">
        {block}
      </p>
    );
  });
}
import {
  createCheckoutSession,
  CreateCheckoutSessionState,
} from "@/lib/actions/baby/createCheckoutSession";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import Image from "next/image";
import { useRouter } from "next/navigation";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export function BabyPoolClient({
  pool,
  guesses,
  user,
  paymentStatus,
}: {
  pool: Tables<"pools">;
  guesses: Tables<"guesses">[];
  user: User | null;
  paymentStatus?: string;
}) {
  const [name, setName] = useState<string>("");
  const router = useRouter();

  // Initialize name from user prop
  useEffect(() => {
    if (user?.user_metadata?.display_name) {
      setName(user.user_metadata.display_name);
    }
  }, [user]);

  const isLoggedIn = !!user;

  // Handle payment status messages
  useEffect(() => {
    if (paymentStatus === "success") {
      // Check if user actually has a recent guess for this pool
      const userGuesses = guesses.filter((guess) => guess.user_id === user?.id);
      const hasRecentGuess = userGuesses.some((guess) => {
        const guessTime = new Date(guess.created_at || 0).getTime();
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000; // 5 minutes ago
        return guessTime > fiveMinutesAgo;
      });

      if (hasRecentGuess) {
        toast.success("Payment successful! Your guess has been recorded.");
      } else {
        // Payment succeeded but no guess found - likely webhook failure
        toast.error(
          "Payment processed but guess creation failed. You will be redirected to get help.",
          { duration: 5000 }
        );
        setTimeout(() => {
          window.location.href = `/payment-error?payment_intent=unknown&session_id=unknown&error=guess_creation_failed`;
        }, 2000);
      }
    } else if (paymentStatus === "cancelled") {
      toast.error("Payment was cancelled. Your guess was not recorded.");
    } else if (paymentStatus === "error") {
      toast.error(
        "There was an error processing your guess. Please contact support if you were charged."
      );
    }
  }, [paymentStatus, guesses, user?.id]);

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
          <h2 className="text-4xl text-pretty font-semibold tracking-tighter mb-1">
            Guess and donate for {pool.baby_name || "the Baby"}&apos;s Arrival!
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Organized by {pool.organized_by}
          </p>
          <div className="flex">
            {/* Baby Image */}
            {pool.image_url && (
              <div className="relative w-40 mb-4 max-w-40 h-40 bg-white p-2 shadow-lg transform -rotate-6 overflow-hidden">
                <div className="relative w-full h-full overflow-hidden">
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
            {/* OrganizerImage */}
            {pool.image_url && (
              <div className="relative w-40 mb-4 max-w-40 h-40 bg-white p-2 shadow-lg transform rotate-6 -translate-x-4 translate-y-4 overflow-hidden">
                <div className="relative w-full h-full overflow-hidden">
                  <Image
                    src={pool.organizer_image_url || pool.image_url}
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
          </div>
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
          <div className="text-foreground leading-relaxed">
            {renderDescription(pool.description)}
          </div>
        )}

        {/* Data Table */}
        <div>
          <h2 className="text-xl font-semibold text-pretty tracking-tight mb-2">
            Previous Donations
          </h2>
          {guesses.length === 0 ? (
            <div className="text-lg text-muted-foreground">
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
                if (isLoggedIn) {
                  const payload = getGuessPayload();
                  if (payload) await formAction(payload);
                }
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
                <Card className="shadow-none">
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
                {isLoggedIn ? (
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
                ) : (
                  <Button
                    type="button"
                    onClick={() => router.push("/auth/login")}
                    className="w-full h-12 text-lg flex items-center justify-center"
                  >
                    Login to Guess
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
