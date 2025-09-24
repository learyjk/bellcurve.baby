import { describe, it, expect } from "vitest";
import {
  ymdToUtcNoon,
  addDaysToYMD,
  formatYmdForDisplay,
  formatYmdShort,
} from "../lib/helpers/date";

describe("date helpers", () => {
  it("ymdToUtcNoon returns a Date at UTC noon for YYYY-MM-DD", () => {
    const dt = ymdToUtcNoon("2025-12-09");
    expect(dt.toISOString()).toBe("2025-12-09T12:00:00.000Z");
  });

  it("addDaysToYMD adds days correctly across month boundaries", () => {
    expect(addDaysToYMD("2025-12-31", 1)).toBe("2026-01-01");
    expect(addDaysToYMD("2025-03-01", -1)).toBe("2025-02-28");
  });

  it("formatYmdForDisplay returns deterministic YYYY-MM-DD string", () => {
    const out = formatYmdForDisplay("2025-12-09");
    expect(out).toBe("2025-12-09");
    expect(formatYmdForDisplay("2024-01-15")).toBe("2024-01-15");
  });

  it("formatYmdShort returns deterministic short month/day", () => {
    const s = formatYmdShort("2025-12-09");
    expect(s).toBe("Dec 9");
    expect(formatYmdShort("2025-01-01")).toBe("Jan 1");
  });
});
