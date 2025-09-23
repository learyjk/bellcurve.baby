"use client";
import { Tables } from "@/database.types";
import { useMemo } from "react";
import { DataTable } from "@/app/baby/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { formatPacificDate } from "@/lib/helpers/date";
import GuessScatterPlot, {
  Guess as BetGuess,
  ActualOutcome as BetActualOutcome,
} from "@/components/baby/guess-scatter-plot";

type RankedGuess = {
  name: string;
  guessed_birth_date: string;
  guessed_weight: number;
  distance: number;
  rank: number;
};

export default function LockedPoolDisplay({
  pool,
  guesses,
}: {
  pool: Tables<"pools">;
  guesses: Tables<"guesses">[];
}) {
  const safeGuesses = useMemo(
    () =>
      guesses.map((guess) => ({
        name: guess.name || "Anonymous",
        guessed_birth_date: guess.guessed_birth_date,
        guessed_weight: guess.guessed_weight,
      })),
    [guesses]
  );

  const ranked: RankedGuess[] = useMemo(() => {
    const actualBirthDate = pool.actual_birth_date;
    const actualBirthWeight = pool.actual_birth_weight;

    if (
      !actualBirthDate ||
      actualBirthWeight === undefined ||
      actualBirthWeight === null ||
      isNaN(Number(actualBirthWeight))
    )
      return [];

    const actualDate = new Date(actualBirthDate).getTime();
    const actualWeight = Number(actualBirthWeight);

    const dateValues = safeGuesses.map((guess) =>
      new Date(guess.guessed_birth_date).getTime()
    );
    dateValues.push(actualDate);
    const minDate = Math.min(...dateValues);
    const maxDate = Math.max(...dateValues);

    const weightValues = safeGuesses.map((guess) => guess.guessed_weight);
    weightValues.push(actualWeight);
    const minWeight = Math.min(...weightValues);
    const maxWeight = Math.max(...weightValues);

    const dateRange = maxDate - minDate || 1;
    const weightRange = maxWeight - minWeight || 1;

    const actualDateNorm = (actualDate - minDate) / dateRange;
    const actualWeightNorm = (actualWeight - minWeight) / weightRange;

    const rankedGuesses = safeGuesses
      .map((guess) => {
        const guessDateValue = new Date(guess.guessed_birth_date).getTime();
        const guessDateNorm = (guessDateValue - minDate) / dateRange;
        const guessWeightNorm =
          (guess.guessed_weight - minWeight) / weightRange;
        const dateDiffNorm = guessDateNorm - actualDateNorm;
        const weightDiffNorm = guessWeightNorm - actualWeightNorm;
        const distance = Math.sqrt(
          Math.pow(dateDiffNorm, 2) + Math.pow(weightDiffNorm, 2)
        );
        return {
          name: guess.name || "Anonymous",
          guessed_birth_date: guess.guessed_birth_date,
          guessed_weight: guess.guessed_weight,
          distance,
        };
      })
      .sort((a, b) => a.distance - b.distance);

    return rankedGuesses.map((guess, index) => ({
      ...guess,
      rank: index + 1,
    }));
  }, [safeGuesses, pool.actual_birth_date, pool.actual_birth_weight]);

  const columns: ColumnDef<RankedGuess>[] = [
    { accessorKey: "rank", header: "Rank" },
    { accessorKey: "name", header: "Name" },
    {
      accessorKey: "guessed_birth_date",
      header: "Guessed Date",
      cell: ({ row }) =>
        formatPacificDate(row.getValue("guessed_birth_date") as string | null),
    },
    {
      accessorKey: "guessed_weight",
      header: "Guessed Weight",
      cell: ({ row }) => {
        const weightInOunces = row.getValue("guessed_weight") as number;
        const pounds = Math.floor(weightInOunces / 16);
        const ounces = Math.round(weightInOunces % 16);
        return `${pounds} lbs ${ounces} oz`;
      },
    },
    {
      accessorKey: "distance",
      header: "Distance",
      cell: ({ row }) => Number(row.getValue("distance")).toFixed(4),
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto rounded-xl p-8">
      <h1 className="font-cherry-bomb text-3xl md:text-6xl font-bold text-pretty text-center tracking-wide mb-4">
        Thanks for playing!
      </h1>
      <p className="text-center mb-8">
        Stay tuned for updates from {pool.organized_by}.
      </p>
      <GuessScatterPlot
        guesses={
          ranked.map((r) => ({
            name: r.name,
            guessed_birth_date: r.guessed_birth_date,
            guessed_weight: r.guessed_weight,
            distance: r.distance,
          })) as BetGuess[]
        }
        actual={
          {
            actualBirthDate: pool.actual_birth_date,
            actualWeight: Number(pool.actual_birth_weight),
          } as BetActualOutcome
        }
      />
      <div className="mt-8">
        <h3 className="font-bold text-2xl mb-2">Final Rankings</h3>
        <DataTable columns={columns} data={ranked} />
      </div>
    </div>
  );
}
