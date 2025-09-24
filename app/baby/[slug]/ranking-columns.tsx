"use client";
import { ColumnDef } from "@tanstack/react-table";
import { RankingWithGuess } from "@/lib/data/rankings/getRankingsForPool";
import { formatYmdForDisplay } from "@/lib/helpers/date";
import LocalDate from "@/components/ui/local-date";

export const rankingColumns: ColumnDef<RankingWithGuess>[] = [
  {
    accessorKey: "rank",
    header: "Rank",
  },
  {
    accessorKey: "guesses.name",
    header: "Name",
    cell: ({ row }) => row.original.guesses?.name || "Anonymous",
  },
  {
    accessorKey: "guesses.guessed_birth_date",
    header: "Guessed Date",
    cell: ({ row }) => {
      const initial = formatYmdForDisplay(
        row.original.guesses?.guessed_birth_date ?? null
      );
      return <LocalDate initial={initial} />;
    },
  },
  {
    accessorKey: "guesses.guessed_weight",
    header: "Guessed Weight",
    cell: ({ row }) => {
      const weightInOunces = row.original.guesses?.guessed_weight;
      if (weightInOunces === null || typeof weightInOunces === "undefined") {
        return "-";
      }
      const pounds = Math.floor(weightInOunces / 16);
      const ounces = Math.round(weightInOunces % 16);
      return `${pounds} lbs ${ounces} oz`;
    },
  },
  {
    accessorKey: "distance",
    header: "Distance",
    cell: ({ row }) => {
      const distance = row.getValue("distance") as number;
      return distance.toFixed(4);
    },
  },
];
