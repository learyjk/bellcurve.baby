export function ymdToUtcNoon(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return new Date(value);
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  return new Date(Date.UTC(y, mo - 1, d, 12, 0, 0));
}

export function addDaysToYMD(value, days) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) {
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

export function formatPacificShort(value) {
  if (!value) return "";
  const dt = ymdToUtcNoon(value);
  return dt.toLocaleString(undefined, { month: "short", day: "numeric" });
}
