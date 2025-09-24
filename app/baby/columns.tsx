"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { Tables } from "@/database.types";
import LocalDate from "@/components/ui/local-date";
import { formatYmdForDisplay } from "@/lib/helpers/date";

export const columns: ColumnDef<Tables<"pools">>[] = [
  {
    accessorKey: "baby_name",
    header: "Baby Name",
    cell: ({ row }) => {
      const baby = row.original;
      return (
        <Link
          href={`/baby/${baby.slug}`}
          className="font-medium hover:underline"
        >
          {baby.baby_name || "Unnamed Baby"}
        </Link>
      );
    },
  },
  {
    accessorKey: "is_locked",
    header: "Status",
    cell: ({ row }) => {
      const isLocked = row.getValue("is_locked");
      return <div>{isLocked ? "Locked" : "Open"}</div>;
    },
  },
  {
    accessorKey: "mu_due_date",
    header: "Due Date",
    cell: ({ row }) => {
      const date = row.getValue("mu_due_date") as string;
      return <LocalDate initial={formatYmdForDisplay(date)} />;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const baby = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/baby/${baby.slug}`}>View Pool</Link>
            </DropdownMenuItem>
            {!baby.is_locked && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link href={`/baby/${baby.slug}/close`}>Close Pool</Link>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
