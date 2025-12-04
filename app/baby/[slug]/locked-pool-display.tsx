"use client";
import { Tables } from "@/database.types";
import { useMemo, useState } from "react";
import { DataTable } from "@/app/baby/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { formatYmdForDisplay, ymdToUtcNoon } from "@/lib/helpers/date";
import GuessScatterPlot, {
  Guess as BetGuess,
  ActualOutcome as BetActualOutcome,
} from "@/components/baby/guess-scatter-plot";

const DISTANCE_DECIMAL_PLACES = 3;

type RankedGuess = {
  name: string;
  guessed_birth_date: string;
  guessed_weight: number;
  distance: number;
  place: number;
  placeDisplay: string;
  id: string; // Unique identifier for hover interaction
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

    const actualDate = ymdToUtcNoon(actualBirthDate).getTime();
    // Database stores weight in pounds, but chart expects ounces
    // Convert from pounds to ounces by multiplying by 16
    const actualWeight = Number(actualBirthWeight) * 16;

    // Get min/max for normalization
    const dateValues = safeGuesses.map((guess) =>
      ymdToUtcNoon(guess.guessed_birth_date).getTime()
    );
    dateValues.push(actualDate);
    const minDate = Math.min(...dateValues);
    const maxDate = Math.max(...dateValues);

    const weightValues = safeGuesses.map((guess) => guess.guessed_weight);
    weightValues.push(actualWeight);
    const minWeight = Math.min(...weightValues);
    const maxWeight = Math.max(...weightValues);

    // Avoid division by zero
    const dateRange = maxDate - minDate || 1;
    const weightRange = maxWeight - minWeight || 1;

    // Normalize actual values
    const actualDateNorm = (actualDate - minDate) / dateRange;
    const actualWeightNorm = (actualWeight - minWeight) / weightRange;

    const guessesWithDistance = safeGuesses
      .map((guess) => {
        const guessDateValue = ymdToUtcNoon(guess.guessed_birth_date).getTime();
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

    // Calculate places with tie detection based on rounded distance
    const rankedWithPlaces: RankedGuess[] = [];
    let currentPlace = 1;
    let i = 0;

    while (i < guessesWithDistance.length) {
      const currentDistance = Number(
        guessesWithDistance[i].distance.toFixed(DISTANCE_DECIMAL_PLACES)
      );
      const tiedGroup: typeof guessesWithDistance = [guessesWithDistance[i]];
      let j = i + 1;

      // Find all guesses with the same rounded distance
      while (
        j < guessesWithDistance.length &&
        Number(guessesWithDistance[j].distance.toFixed(DISTANCE_DECIMAL_PLACES)) ===
        currentDistance
      ) {
        tiedGroup.push(guessesWithDistance[j]);
        j++;
      }

      // Assign place to all tied guesses - all tied entries show the same place number
      tiedGroup.forEach((guess) => {
        // Create unique ID from name, date, and weight
        const id = `${guess.name}-${guess.guessed_birth_date}-${guess.guessed_weight}`;
        rankedWithPlaces.push({
          ...guess,
          place: currentPlace,
          placeDisplay: `${currentPlace}`,
          id,
        });
      });

      // Move to next place: if 2 people tied for 2nd, next person is 3rd (not 4th)
      // After assigning place N to K tied people, next place is N + 1
      currentPlace = currentPlace + 1;
      i = j;
    }

    return rankedWithPlaces;
  }, [safeGuesses, pool.actual_birth_date, pool.actual_birth_weight]);

  const columns: ColumnDef<RankedGuess>[] = [
    {
      id: "place",
      header: "Place",
      cell: ({ row }) => row.original.placeDisplay,
    },
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
      cell: ({ row }) =>
        Number(row.getValue("distance")).toFixed(DISTANCE_DECIMAL_PLACES),
    },
  ];

  const [hoveredGuessId, setHoveredGuessId] = useState<string | null>(null);

  return (
    <div className="w-full min-w-0 max-w-6xl mx-auto rounded-xl px-4 py-8 md:px-8">
      <h1 className="font-cherry-bomb text-3xl md:text-6xl font-bold text-pretty text-center tracking-wide mb-4">
        Thanks for playing!
      </h1>
      <p className="text-center mb-8">
        Stay tuned for updates from {pool.organized_by}.
      </p>
      <div className="w-full min-w-0 overflow-x-auto">
        <GuessScatterPlot
          guesses={
            ranked.map((r) => ({
              name: r.name,
              guessed_birth_date: r.guessed_birth_date,
              guessed_weight: r.guessed_weight,
              distance: r.distance,
              place: r.place,
              id: r.id,
            })) as BetGuess[]
          }
          actual={
            {
              actualBirthDate: pool.actual_birth_date,
              // Database stores weight in pounds, but chart expects ounces
              actualWeight: Number(pool.actual_birth_weight) * 16,
            } as BetActualOutcome
          }
          hoveredGuessId={hoveredGuessId}
        />
      </div>
      <div className="mt-8 w-full min-w-0">
        <h3 className="font-bold text-2xl mb-2">Final Rankings</h3>
        <DataTable
          columns={columns}
          data={ranked}
          onRowHover={(row) => setHoveredGuessId(row.original.id)}
          onRowLeave={() => setHoveredGuessId(null)}
        />
      </div>
    </div>
  );
}
