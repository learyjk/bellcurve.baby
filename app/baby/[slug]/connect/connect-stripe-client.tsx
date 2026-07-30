"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { CheckCircle, ExternalLink, AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  poolId: string;
  poolSlug: string;
  babyName: string;
  isConnected: boolean;
  status?: string; // 'incomplete' | 'refresh' | undefined
}

export default function ConnectStripeClient({
  poolId,
  poolSlug,
  babyName,
  isConnected,
  status,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poolId }),
      });
      const data = await res.json();
      if (data.alreadyConnected) {
        router.push(`/baby/${poolSlug}?connect=success`);
        return;
      }
      if (data.error) {
        setError(data.error);
        return;
      }
      // Redirect to Stripe-hosted onboarding
      window.location.href = data.url;
    } catch (e) {
      setError("Something went wrong. Please try again.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-6 w-6" />
            Stripe Connected!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Your Stripe account is connected. Payments for{" "}
            <strong>{babyName}</strong>&apos;s pool will go directly to you.
          </p>
          <Button onClick={() => router.push(`/baby/${poolSlug}`)} className="w-full">
            Go to Pool
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isIncomplete = status === "incomplete" || status === "refresh";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="tracking-tighter text-2xl">
          Connect Your Stripe Account
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isIncomplete && (
          <div className="flex items-start gap-3 rounded-lg bg-yellow-50 border border-yellow-200 p-4">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Onboarding not completed
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                You didn&apos;t finish connecting your Stripe account. Click below
                to resume — your progress may be saved.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            To collect the money from <strong>{babyName}</strong>&apos;s pool,
            you need to connect a Stripe account. This takes about 2 minutes.
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Payments go <strong>directly to you</strong> — not through us</li>
            <li>Stripe handles all payment processing securely</li>
            <li>You can use an existing Stripe account or create a new one</li>
            <li>
              In test mode, use SSN <code className="bg-muted px-1 rounded">000-00-0000</code> and
              routing <code className="bg-muted px-1 rounded">110000000</code>
            </li>
          </ul>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Button
          onClick={handleConnect}
          disabled={loading}
          className="w-full h-12 text-base"
        >
          {loading ? (
            <><LoadingSpinner /> Connecting...</>
          ) : isIncomplete ? (
            <><RefreshCw className="h-4 w-4 mr-2" /> Resume Stripe Onboarding</>
          ) : (
            <><ExternalLink className="h-4 w-4 mr-2" /> Connect with Stripe</>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Your pool page is live but guesses are disabled until Stripe is connected.
        </p>

        <Button
          variant="ghost"
          onClick={() => router.push(`/baby/${poolSlug}`)}
          className="w-full"
        >
          View Pool Page (payments disabled)
        </Button>
      </CardContent>
    </Card>
  );
}
