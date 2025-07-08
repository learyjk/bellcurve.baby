"use client";
import { ColumnDef } from "@tanstack/react-table";
import { Tables } from "@/database.types";

export const betColumns: ColumnDef<Tables<"bets">>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => row.getValue("name") || "Anonymous",
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
    header: "Guessed Weight (lbs)",
    cell: ({ row }) => {
      const weight = row.getValue("guessed_weight");
      return Number(weight).toFixed(1);
    },
  },
  {
    accessorKey: "calculated_price",
    header: "Bet Price ($)",
    cell: ({ row }) => {
      const price = row.getValue("calculated_price");
      return Number(price).toFixed(2);
    },
  },
  {
    accessorKey: "created_at",
    header: "Placed At",
    cell: ({ row }) => {
      const date = row.getValue("created_at") as string | null;
      return date ? new Date(date).toLocaleString() : "-";
    },
  },
];
