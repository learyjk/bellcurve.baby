"use client";
import { useEffect, useState } from "react";

export default function LocalDate({
  initial,
  options,
}: {
  initial?: string | null;
  options?: Intl.DateTimeFormatOptions;
}) {
  const [label, setLabel] = useState<string | null>(
    initial ? String(initial) : null
  );

  useEffect(() => {
    if (!initial) return;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(initial);
    if (m) {
      const y = Number(m[1]);
      const mo = Number(m[2]);
      const d = Number(m[3]);
      // Use UTC noon for stable instant
      const dt = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0));
      setLabel(
        new Intl.DateTimeFormat(undefined, {
          year: "numeric",
          month: "numeric",
          day: "numeric",
          ...(options || {}),
        }).format(dt)
      );
      return;
    }
    const parsed = new Date(initial);
    if (!isNaN(parsed.getTime())) {
      setLabel(
        new Intl.DateTimeFormat(undefined, {
          year: "numeric",
          month: "numeric",
          day: "numeric",
          ...(options || {}),
        }).format(parsed)
      );
    }
  }, [initial, options]);

  if (!label) return <>{initial ?? "-"}</>;
  return <>{label}</>;
}
