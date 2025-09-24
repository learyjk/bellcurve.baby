import { useMemo } from "react";
import { DataTable } from "@/app/baby/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { formatYmdForDisplay, ymdToUtcNoon } from "@/lib/helpers/date";
import GuessScatterPlot, {
  Guess as BetGuess,
  ActualOutcome as BetActualOutcome,
} from "@/components/baby/guess-scatter-plot";

export type RankedGuess = {
  name: string;
  guessed_birth_date: string;
  guessed_weight: number;
  distance: number;
};

export function LiveRankingsTable({
  guesses,
  actualBirthDate,
  actualBirthWeight,
}: {
  guesses: Array<{
    name: string;
    guessed_birth_date: string;
    guessed_weight: number;
  }>;
  actualBirthDate: string;
  actualBirthWeight?: number;
}) {
  // Client-side ranking logic
  const ranked: RankedGuess[] = useMemo(() => {
    if (
      !actualBirthDate ||
      actualBirthWeight === undefined ||
      actualBirthWeight === null ||
      isNaN(Number(actualBirthWeight))
    )
      return [];
    const actualDate = ymdToUtcNoon(actualBirthDate).getTime();
    const actualWeight = Number(actualBirthWeight);
    // Get min/max for normalization
    const dateValues = guesses.map((guess) =>
      ymdToUtcNoon(guess.guessed_birth_date).getTime()
    );
    dateValues.push(actualDate);
    const minDate = Math.min(...dateValues);
    const maxDate = Math.max(...dateValues);
    const weightValues = guesses.map((guess) => guess.guessed_weight);
    weightValues.push(actualWeight);
    const minWeight = Math.min(...weightValues);
    const maxWeight = Math.max(...weightValues);
    // Avoid division by zero
    const dateRange = maxDate - minDate || 1;
    const weightRange = maxWeight - minWeight || 1;
    // Normalize actual values
    const actualDateNorm = (actualDate - minDate) / dateRange;
    const actualWeightNorm = (actualWeight - minWeight) / weightRange;
    return guesses
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
  }, [guesses, actualBirthDate, actualBirthWeight]);

  const columns: ColumnDef<RankedGuess>[] = [
    { accessorKey: "name", header: "Name" },
    {
      accessorKey: "guessed_birth_date",
      header: "Guessed Date",
      cell: ({ row }) =>
        // Use server-side deterministic YYYY-MM-DD as initial value to avoid
        // hydration mismatch; LocalDate will localize on the client.
        formatYmdForDisplay(
          row.getValue("guessed_birth_date") as string | null
        ),
    },
    {
      accessorKey: "guessed_weight",
      header: "Guessed Weight (lbs)",
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
      cell: ({ row }) => Number(row.getValue("distance")).toFixed(2),
    },
  ];

  return (
    <div className="mt-8">
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
            actualBirthDate: actualBirthDate,
            actualWeight: Number(actualBirthWeight),
          } as BetActualOutcome
        }
      />
      <DataTable columns={columns} data={ranked} />
      <div className="mt-8"></div>
    </div>
  );
}
