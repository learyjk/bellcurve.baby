"use client";

import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/** Format a Date as yyyy-mm-dd in local time (matches input[type=date] values). */
export function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parse a yyyy-mm-dd string into a local Date (undefined if empty/invalid). */
export function fromDateInputValue(v: string): Date | undefined {
  if (!v) return undefined;
  const [y, m, d] = v.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

export interface DatePickerProps {
  /** Value as yyyy-mm-dd (same format as input[type=date]). */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  className?: string;
}

/**
 * Date picker matching the design system: a button styled like Input
 * opening a Calendar in a Popover. Empty state shows a muted placeholder
 * (unlike native date inputs, whose mm/dd/yyyy looks like a real value).
 */
export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  id,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selected = fromDateInputValue(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          className={cn(
            "flex h-9 w-full items-center gap-2 rounded-md border border-input bg-input-background px-3 py-1 text-base shadow-sm transition-colors md:text-sm",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            !selected && "text-muted-foreground/70",
            className
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0 opacity-60" />
          {selected ? (
            selected.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          ) : (
            <span className="italic">{placeholder}</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-3">
        <Calendar
          selected={selected}
          onSelect={(day) => {
            onChange(toDateInputValue(day));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
