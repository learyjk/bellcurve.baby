"use client";

import { useState, useEffect, useActionState } from "react";
import { Tables } from "@/database.types";
import { User } from "@supabase/supabase-js";
import { GuessSliders } from "@/components/ui/baby/guess-sliders";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/app/baby/data-table";
import {
  guessColumns,
  ownerGuessColumns,
} from "@/app/baby/[slug]/columns";
import { getGuessPrice } from "@/lib/helpers/pricing";
import { loadStripe } from "@stripe/stripe-js";
import { toast } from "sonner";
import { AlertCircle, ExternalLink, Pencil } from "lucide-react";

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
import { getVideoEmbed } from "@/lib/helpers/videoEmbed";
import { addDaysToYMD } from "@/lib/helpers/date";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export function BabyPoolClient({
  pool,
  guesses,
  user,
  paymentStatus,
  connectStatus,
}: {
  pool: Tables<"pools">;
  guesses: Tables<"guesses">[];
  user: User | null;
  paymentStatus?: string;
  connectStatus?: string;
}) {
  const [name, setName] = useState<string>("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Initialize name from user prop
  useEffect(() => {
    if (user?.user_metadata?.display_name) {
      setName(user.user_metadata.display_name);
    }
  }, [user]);

  const isLoggedIn = !!user;
  const isOwner = user?.id === pool.user_id;

  // Optional embedded video (YouTube/Vimeo) configured at pool creation.
  const videoEmbed = getVideoEmbed(pool.video_url);

  // Handle payment status messages
  useEffect(() => {
    if (!paymentStatus) return;

    let timer: ReturnType<typeof setTimeout> | null = null;

    const showToasts = () => {
      if (paymentStatus === "success") {
        toast.success("Payment successful! Your guess has been recorded.", {
          duration: 4000,
        });
      } else if (paymentStatus === "cancelled") {
        toast.error("Payment was cancelled. Your guess was not recorded.");
      } else if (paymentStatus === "error") {
        toast.error(
          "There was an error processing your payment. Please contact support if you were charged."
        );
      }
    };

    try {
      showToasts();
    } catch (err) {
      console.warn("Immediate toast failed, will retry after delay", err);
    }

    timer = setTimeout(() => {
      try {
        showToasts();
      } catch (err) {
        console.error("Fallback toast failed", err);
      }
    }, 200);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [paymentStatus]);

  // Handle Stripe Connect status messages
  useEffect(() => {
    if (connectStatus === "success") {
      toast.success(
        "🎉 Stripe connected! Your pool is now accepting payments.",
        { duration: 5000 }
      );
    }
  }, [connectStatus]);

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
      // If the pool owner hasn't connected Stripe, offer to take them there
      if (state.connectRequired && isOwner) {
        router.push(`/baby/${pool.slug}/connect`);
      }
    }
    if (state.sessionId) {
      const handleRedirect = async () => {
        const stripe = await stripePromise;
        if (stripe) {
          setIsRedirecting(true);
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
    // Use UTC-safe helpers so the YMD does not shift based on client TZ.
    const dueYmd = pool.mu_due_date as string;
    const guessDateYmd = addDaysToYMD(dueYmd, birthDateDeviation);
    const guessDateYMD = guessDateYmd; // already Y-M-D string
    return {
      poolId: pool.id,
      slug: pool.slug,
      guessDate: guessDateYMD, // send as YYYY-MM-DD
      guessWeight: weightGuessOunces,
      price: totalPrice,
      babyName: pool.baby_name || "the baby",
      name,
      isAnonymous,
    };
  };

  const { totalPrice, datePrice, weightPrice } = getGuessPrice({
    pool,
    birthDateDeviation,
    // For pricing, use ounces directly
    weightGuess: weightGuessOunces,
  });

  // Calculate total donations from all guesses
  const totalDonations = guesses
    .filter((guess) => guess.payment_status !== "refunded")
    .reduce((sum, guess) => sum + (guess.calculated_price || 0), 0);

  const stripeConnected = Boolean(
    pool.stripe_account_id && pool.stripe_onboarding_complete
  );

  const needsStripeConnect = isOwner && !stripeConnected;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-24">
      {/* Stripe Connect banner — only shown to the pool owner */}
      {needsStripeConnect && (
        <div className="lg:col-span-2 flex items-start gap-3 rounded-lg bg-yellow-50 border border-yellow-200 p-4">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800">
              Connect Stripe to enable payments
            </p>
            <p className="text-sm text-yellow-700 mt-1">
              Your pool is live but guesses are disabled until you connect your
              Stripe account. This lets you receive payments directly.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => router.push(`/baby/${pool.slug}/connect`)}
            className="flex-shrink-0"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Connect Stripe
          </Button>
        </div>
      )}
      {/* Left Column - Content Area */}
      <div className="space-y-6">
        <div>
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-4xl text-pretty font-semibold tracking-tighter mb-1">
              Guess and donate for {pool.baby_name || "the Baby"}&apos;s Arrival!
            </h2>
            {isOwner && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/baby/${pool.slug}/edit`)}
                className="flex-shrink-0 mt-2"
              >
                <Pencil className="h-4 w-4 mr-1" />
                Edit Pool
              </Button>
            )}
          </div>
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
            {pool.organizer_image_url && (
              <div className="relative w-40 mb-4 max-w-40 h-40 bg-white p-2 shadow-lg transform rotate-6 -translate-x-4 translate-y-4 overflow-hidden">
                <div className="relative w-full h-full overflow-hidden">
                  <Image
                    src={pool.organizer_image_url}
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
          {videoEmbed && (
            <div
              style={{
                position: "relative",
                paddingBottom: "56.25%",
                marginTop: "1.5rem",
              }}
              className="w-full rounded-lg overflow-hidden"
            >
              <iframe
                src={videoEmbed.embedUrl}
                title="Pool video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                }}
              ></iframe>
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
            <DataTable
              columns={isOwner ? ownerGuessColumns : guessColumns}
              data={guesses}
            />
          )}
        </div>
      </div>

      {/* Right Column - Sticky Sidebar */}
      <div className="lg:sticky lg:top-4 lg:h-fit">
        <Card>
          <CardContent className="p-4 space-y-6">
            {/* Show sum of all donations */}
            <div>
              <div className="font-cherry-bomb text-4xl mb-1">
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
                      {`$${totalPrice.toFixed(2)}`}
                    </div>
                    <div className="flex justify-center items-start gap-2">
                      <div className="flex flex-col items-end font-mono space-y-1 text-xs text-muted-foreground">
                        <span>Date price:</span>
                        <span>Weight price:</span>
                      </div>
                      <div className="flex flex-col items-start font-mono space-y-1 text-xs text-muted-foreground">
                        <span>{`$${datePrice.toFixed(2)}`}</span>
                        <span>{`$${weightPrice.toFixed(2)}`}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="flex items-center space-x-2 mt-4">
                <Checkbox
                  id="anonymous"
                  checked={isAnonymous}
                  onCheckedChange={(checked) =>
                    setIsAnonymous(checked as boolean)
                  }
                />
                <Label htmlFor="anonymous">
                  Make my guess publicly anonymous
                </Label>
              </div>
              <div className="text-center mt-4">
                {isLoggedIn ? (
                  <>
                    <Button
                      type="submit"
                      disabled={isPending || isRedirecting || !stripeConnected}
                      className="w-full h-12 text-lg flex items-center justify-center"
                    >
                      {isPending || isRedirecting ? (
                        <>
                          <LoadingSpinner />
                          Processing...
                        </>
                      ) : (
                        `Place Guess for $${totalPrice.toFixed(2)}`
                      )}
                    </Button>
                    {!stripeConnected && !isOwner && (
                      <p className="text-sm text-muted-foreground mt-2">
                        This pool isn&apos;t accepting guesses yet — the owner
                        hasn&apos;t finished setting up payments.
                      </p>
                    )}
                  </>
                ) : (
                  <Button
                    type="button"
                    onClick={() => router.push(`/auth/login?next=${pathname}`)}
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
      {/* Floating video preview */}
      {/* <FloatingVideoPreview /> */}
    </div>
  );
}

// (FloatingVideoPreview moved to its own file: components/ui/floating-video-preview.tsx)
