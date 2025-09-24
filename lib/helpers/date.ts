// Shared utilities for date formatting

// Format a date value derived from a YYYY-MM-DD string in a timezone-neutral
// way for display. We parse YMD to UTC-noon (to avoid offsets) then format
// in the user's locale without forcing any particular timezone. This keeps
// the displayed day consistent regardless of viewer location while allowing
// local formatting (e.g., "Dec 9, 2025" vs "9 Dec 2025").
export function formatYmdForDisplay(value?: string | null): string {
  if (!value) return "-";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (match) {
    // Return a deterministic YYYY-MM-DD string so server and client render the
    // same initial HTML. Client-side will reformat to the user's locale if
    // desired via a client-only component.
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  const dt = new Date(value);
  if (isNaN(dt.getTime())) return String(value);
  // Fallback: ISO date
  return dt.toISOString().slice(0, 10);
}

// Parse a plain YYYY-MM-DD string and return a Date set to UTC noon for that day.
// Using UTC noon avoids timezone shifts when the date is formatted in other timezones
// or when the runtime is in a different local timezone.
export function ymdToUtcNoon(value: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return new Date(value);
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  return new Date(Date.UTC(y, mo - 1, d, 12, 0, 0));
}

// Add (or subtract) days to a YYYY-MM-DD date string and return a new YYYY-MM-DD string.
// This performs arithmetic in UTC to avoid local timezone shifts.
export function addDaysToYMD(value: string, days: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) {
    // Fallback: try Date parsing and adjust using UTC methods.
    const dt = new Date(value);
    if (isNaN(dt.getTime())) return value;
    const res = new Date(
      Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate(), 12, 0, 0)
    );
    res.setUTCDate(res.getUTCDate() + days);
    return res.toISOString().slice(0, 10);
  }
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

// Short month/day format (e.g. "Dec 9") for UI labels while preserving the
// interpretation of the source string as a date-only value. Returns a deterministic
// English format to avoid server/client hydration mismatches when user locales differ.
export function formatYmdShort(value?: string | null): string {
  if (!value) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return value;

  const monthNum = Number(m[2]);
  const day = Number(m[3]);

  // Use deterministic English month names to avoid locale hydration issues
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const monthName = monthNames[monthNum - 1] || "???";
  return `${monthName} ${day}`;
}
