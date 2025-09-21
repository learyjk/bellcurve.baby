"use client";
import { ColumnDef } from "@tanstack/react-table";
import { Tables } from "@/database.types";

export const guessColumns: ColumnDef<Tables<"guesses">>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const isAnonymous = row.original.is_anonymous;
      const name: string = row.getValue("name");
      return isAnonymous ? "Anonymous" : name || "Anonymous";
    },
  },
  {
    accessorKey: "guessed_birth_date",
    header: "Guessed Date",
    cell: ({ row }) => {
      const date = row.getValue("guessed_birth_date") as string;
      return new Date(date).toLocaleDateString();
    },
  },
  {
    accessorKey: "guessed_weight",
    header: "Guessed Weight",
    cell: ({ row }) => {
      const weightInOunces = row.getValue("guessed_weight") as number;
      if (weightInOunces === null || typeof weightInOunces === "undefined") {
        return "-";
      }
      const pounds = Math.floor(weightInOunces / 16);
      const ounces = Math.round(weightInOunces % 16);
      return `${pounds} lbs ${ounces} oz`;
    },
  },
  {
    accessorKey: "calculated_price",
    header: "Guess Price ($)",
    cell: ({ row }) => {
      const price = row.getValue("calculated_price");
      return Number(price).toFixed(2);
    },
  },
];
