import * as React from "react";
import { CircleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

export function RequiredMark() {
  // aria-hidden: the input itself carries `required`, which is what assistive
  // tech announces — the visual asterisk would be read as punctuation.
  return (
    <span className="text-destructive" aria-hidden="true">
      {" "}*
    </span>
  );
}

export function OptionalMark() {
  return (
    <span className="text-muted-foreground font-normal text-xs">
      {" "}(optional)
    </span>
  );
}

export interface FieldErrorProps extends React.ComponentProps<"p"> {
  /** Render nothing when falsy so callers can pass the message directly. */
  message?: string | null;
}

/**
 * Inline error message for form fields. Not color-alone (WCAG 1.4.1): pairs
 * destructive text with an alert icon. Link from the input via aria-describedby.
 */
export function FieldError({ id, message, className, ...props }: FieldErrorProps) {
  if (!message) return null;
  return (
    <p
      id={id}
      className={cn("mt-1 flex items-start gap-1 text-xs text-destructive", className)}
      {...props}
    >
      <CircleAlert className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}
