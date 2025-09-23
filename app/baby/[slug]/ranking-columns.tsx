"use client";
import { ColumnDef } from "@tanstack/react-table";
import { RankingWithGuess } from "@/lib/data/rankings/getRankingsForPool";
import { formatPacificDate } from "@/lib/helpers/date";

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
    cell: ({ row }) =>
      formatPacificDate(row.original.guesses?.guessed_birth_date ?? null),
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
