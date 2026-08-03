"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Tables } from "@/database.types";
import { refundGuess } from "@/lib/actions/baby/refundGuess";
import { getTotalCents } from "@/lib/constants";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export function RefundCell({ guess }: { guess: Tables<"guesses"> }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (guess.payment_status === "refunded") {
    return <span className="text-xs text-muted-foreground">Refunded</span>;
  }

  if (guess.payment_status !== "paid") {
    return null;
  }

  const price = Number(guess.calculated_price ?? 0);
  // Donors were charged the guess plus the platform fee on top, so a full
  // refund returns that larger amount.
  const chargeTotal = getTotalCents(Math.round(price * 100)) / 100;
  const name = guess.is_anonymous ? "Anonymous" : guess.name || "Anonymous";

  const handleRefund = () => {
    startTransition(async () => {
      const result = await refundGuess(guess.id);
      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success(result.success);
        setOpen(false);
        router.refresh();
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          Refund
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Issue a refund?</AlertDialogTitle>
          <AlertDialogDescription>
            This will refund{" "}
            <strong className="text-foreground">
              ${chargeTotal.toFixed(2)}
            </strong>{" "}
            (the ${price.toFixed(2)} guess plus platform fee) to{" "}
            <strong className="text-foreground">{name}</strong>&apos;s card.
            This action is <strong>irreversible</strong> — the money goes back
            immediately and cannot be reclaimed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault(); // keep dialog open while processing
              handleRefund();
            }}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <LoadingSpinner /> Refunding...
              </>
            ) : (
              `Yes, refund $${chargeTotal.toFixed(2)}`
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
