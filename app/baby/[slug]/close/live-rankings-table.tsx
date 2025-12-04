import { useMemo, useState } from "react";
import { DataTable } from "@/app/baby/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { formatYmdForDisplay, ymdToUtcNoon } from "@/lib/helpers/date";
import GuessScatterPlot, {
  Guess as BetGuess,
  ActualOutcome as BetActualOutcome,
} from "@/components/baby/guess-scatter-plot";

const DISTANCE_DECIMAL_PLACES = 3;

export type RankedGuess = {
  name: string;
  guessed_birth_date: string;
  guessed_weight: number;
  distance: number;
  place: number;
  placeDisplay: string;
  id: string; // Unique identifier for hover interaction
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
  // Client-side ranking logic with tie detection
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
    const guessesWithDistance = guesses
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
  }, [guesses, actualBirthDate, actualBirthWeight]);

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
    <div className="mt-8">
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
            actualBirthDate: actualBirthDate,
            actualWeight: Number(actualBirthWeight),
          } as BetActualOutcome
        }
        hoveredGuessId={hoveredGuessId}
      />
      <DataTable
        columns={columns}
        data={ranked}
        onRowHover={(row) => setHoveredGuessId(row.original.id)}
        onRowLeave={() => setHoveredGuessId(null)}
      />
      <div className="mt-8"></div>
    </div>
  );
}
