// Shared utilities for date formatting

// Format a date value as an absolute Pacific date (America/Los_Angeles),
// avoiding timezone shifts when the source is a plain YYYY-MM-DD string.
export function formatPacificDate(value?: string | null): string {
  if (!value) return "-";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (match) {
    const y = Number(match[1]);
    const m = Number(match[2]);
    const d = Number(match[3]);
    // Use noon UTC to ensure the resulting LA date remains the same day
    // regardless of DST or the viewer's local timezone.
    const utcNoon = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    return new Intl.DateTimeFormat(undefined, {
      timeZone: "America/Los_Angeles",
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }).format(utcNoon);
  }
  const dt = new Date(value);
  if (isNaN(dt.getTime())) return String(value);
  return new Intl.DateTimeFormat(undefined, {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(dt);
}
