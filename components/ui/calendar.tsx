"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export interface CalendarProps {
  /** Currently selected day (undefined = nothing selected). */
  selected?: Date;
  onSelect: (day: Date) => void;
  /** Month initially displayed when nothing is selected. */
  defaultMonth?: Date;
  className?: string;
}

/**
 * Minimal month-grid calendar matching the design system
 * (uses the same tokens/radius as Button, Popover, etc.).
 */
export function Calendar({
  selected,
  onSelect,
  defaultMonth,
  className,
}: CalendarProps) {
  const initial = selected ?? defaultMonth ?? new Date();
  const [viewYear, setViewYear] = React.useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = React.useState(initial.getMonth());

  // Keep the viewed month in sync if `selected` changes from outside.
  React.useEffect(() => {
    if (selected) {
      setViewYear(selected.getFullYear());
      setViewMonth(selected.getMonth());
    }
  }, [selected]);

  const today = startOfDay(new Date());

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (Date | null)[] = [
    ...Array<null>(startWeekday).fill(null),
    ...Array.from(
      { length: daysInMonth },
      (_, i) => new Date(viewYear, viewMonth, i + 1)
    ),
  ];

  const monthLabel = firstOfMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const go = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  return (
    <div className={cn("w-[252px] select-none", className)}>
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => go(-1)}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-sm font-medium tracking-tight">{monthLabel}</div>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => go(1)}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="h-7 flex items-center justify-center text-[11px] font-medium text-muted-foreground"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) =>
          day === null ? (
            <div key={`blank-${i}`} className="h-8" />
          ) : (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelect(day)}
              className={cn(
                "h-8 w-8 mx-auto rounded-md text-sm transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                selected &&
                  isSameDay(day, selected) &&
                  "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground font-medium",
                isSameDay(day, today) &&
                  !(selected && isSameDay(day, selected)) &&
                  "border border-primary/50 text-foreground font-medium"
              )}
            >
              {day.getDate()}
            </button>
          )
        )}
      </div>
    </div>
  );
}
