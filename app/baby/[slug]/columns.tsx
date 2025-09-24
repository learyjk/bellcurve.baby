"use client";
import { ColumnDef, Column } from "@tanstack/react-table";
import { Tables } from "@/database.types";
import { formatYmdForDisplay } from "@/lib/helpers/date";
import LocalDate from "@/components/ui/local-date";
import { ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

function SortableHeader({
  label,
  column,
}: {
  label: string;
  column: Column<Tables<"guesses">, unknown>;
}) {
  const sorted = column.getIsSorted();
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(sorted === "asc")}
      className="p-0 flex items-center gap-2"
    >
      <span>{label}</span>
      {/* Reserve 16px x 16px space for the icon so column width doesn't shift */}
      <span className="w-4 h-4 inline-flex items-center justify-center">
        {sorted === "asc" ? (
          <ArrowUp className="h-4 w-4" />
        ) : sorted === "desc" ? (
          <ArrowDown className="h-4 w-4" />
        ) : (
          <span className="h-4 w-4" />
        )}
      </span>
    </Button>
  );
}

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
    header: ({ column }) => (
      <SortableHeader label="Guessed Date" column={column} />
    ),
    cell: ({ row }) => {
      const date = row.getValue("guessed_birth_date") as string | null;
      const initial = formatYmdForDisplay(date);
      return <LocalDate initial={initial} />;
    },
  },
  {
    accessorKey: "guessed_weight",
    header: ({ column }) => (
      <SortableHeader label="Guessed Weight" column={column} />
    ),
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
    header: ({ column }) => (
      <SortableHeader label="Guess Price ($)" column={column} />
    ),
    cell: ({ row }) => {
      const price = row.getValue("calculated_price");
      return Number(price || 0).toFixed(2);
    },
  },
];
