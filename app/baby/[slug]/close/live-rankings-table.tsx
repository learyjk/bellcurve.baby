import { useMemo } from "react";
import { DataTable } from "@/app/baby/data-table";
import { ColumnDef } from "@tanstack/react-table";
import BetScatterPlot, {
  Guess as BetGuess,
  ActualOutcome as BetActualOutcome,
} from "@/components/baby/bet-scatter-plot";

type RankedBet = {
  name: string;
  guessed_birth_date: string;
  guessed_weight: number;
  distance: number;
};

export function LiveRankingsTable({
  bets,
  actualBirthDate,
  actualBirthWeight,
}: {
  bets: Array<{
    name: string;
    guessed_birth_date: string;
    guessed_weight: number;
  }>;
  actualBirthDate: string;
  actualBirthWeight?: number;
}) {
  // Client-side ranking logic
  const ranked: RankedBet[] = useMemo(() => {
    if (
      !actualBirthDate ||
      actualBirthWeight === undefined ||
      actualBirthWeight === null ||
      isNaN(Number(actualBirthWeight))
    )
      return [];
    const actualDate = new Date(actualBirthDate).getTime();
    const actualWeight = Number(actualBirthWeight);
    // Get min/max for normalization
    const dateValues = bets.map((bet) =>
      new Date(bet.guessed_birth_date).getTime()
    );
    dateValues.push(actualDate);
    const minDate = Math.min(...dateValues);
    const maxDate = Math.max(...dateValues);
    const weightValues = bets.map((bet) => bet.guessed_weight);
    weightValues.push(actualWeight);
    const minWeight = Math.min(...weightValues);
    const maxWeight = Math.max(...weightValues);
    // Avoid division by zero
    const dateRange = maxDate - minDate || 1;
    const weightRange = maxWeight - minWeight || 1;
    // Normalize actual values
    const actualDateNorm = (actualDate - minDate) / dateRange;
    const actualWeightNorm = (actualWeight - minWeight) / weightRange;
    return bets
      .map((bet) => {
        const guessDateValue = new Date(bet.guessed_birth_date).getTime();
        const guessDateNorm = (guessDateValue - minDate) / dateRange;
        const guessWeightNorm = (bet.guessed_weight - minWeight) / weightRange;
        const dateDiffNorm = guessDateNorm - actualDateNorm;
        const weightDiffNorm = guessWeightNorm - actualWeightNorm;
        const distance = Math.sqrt(
          Math.pow(dateDiffNorm, 2) + Math.pow(weightDiffNorm, 2)
        );
        return {
          name: bet.name || "Anonymous",
          guessed_birth_date: bet.guessed_birth_date,
          guessed_weight: bet.guessed_weight,
          distance,
        };
      })
      .sort((a, b) => a.distance - b.distance);
  }, [bets, actualBirthDate, actualBirthWeight]);

  const columns: ColumnDef<RankedBet>[] = [
    { accessorKey: "name", header: "Name" },
    {
      accessorKey: "guessed_birth_date",
      header: "Guessed Date",
      cell: ({ row }) =>
        new Date(
          row.getValue("guessed_birth_date") as string
        ).toLocaleDateString(),
    },
    {
      accessorKey: "guessed_weight",
      header: "Guessed Weight (lbs)",
      cell: ({ row }) => Number(row.getValue("guessed_weight")).toFixed(1),
    },
    {
      accessorKey: "distance",
      header: "Distance",
      cell: ({ row }) => Number(row.getValue("distance")).toFixed(2),
    },
  ];

  return (
    <div className="mt-8">
      <h3 className="font-bold text-2xl mb-2">Live Rankings</h3>
      <DataTable columns={columns} data={ranked} />
      <div className="mt-8">
        <BetScatterPlot
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
      </div>
    </div>
  );
}
