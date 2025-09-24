import {
  ymdToUtcNoon,
  addDaysToYMD,
  formatPacificShort,
} from "./date-utils.mjs";

// Demo script to show timezone-neutral handling of YYYY-MM-DD date strings
// Run with: node scripts/check-dates.mjs

const examples = ["2025-12-09", "2025-03-08", "2025-11-01"];

console.log("=== YMD handling demo ===");
for (const ymd of examples) {
  const dt = ymdToUtcNoon(ymd);
  console.log(`YMD: ${ymd}`);
  console.log(`  UTC-noon ISO: ${dt.toISOString()}`);
  console.log(`  millis: ${dt.getTime()}`);
  console.log(`  formatted (short): ${formatPacificShort(ymd)}`);
  console.log(`  +1 day -> ${addDaysToYMD(ymd, 1)}`);
  console.log("");
}

// Show that using JS Date on the YMD string directly may produce different
// instantiations in some runtimes/hosts. We'll print both.
console.log("=== Direct Date constructor vs ymdToUtcNoon ===");
const ymd = "2025-12-09";
const direct = new Date(ymd);
console.log(
  'new Date("' + ymd + '") ->',
  direct.toString(),
  direct.toISOString()
);
const safe = ymdToUtcNoon(ymd);
console.log(
  'ymdToUtcNoon("' + ymd + '") ->',
  safe.toString(),
  safe.toISOString()
);

console.log(
  "\nNote: For storage we recommend keeping the original YYYY-MM-DD string in the DB."
);
console.log(
  "Display and arithmetic can use helpers in lib/helpers/date.js to avoid timezone shifts."
);
