import { describe, it, expect } from "vitest";
import { rankBetsByAccuracy } from "../lib/helpers/rankBetsByAccuracy";

// Actual outcome: March 15 2026, 120 oz (7.5 lbs)
const actual = { actualBirthDate: "2026-03-15", actualWeight: 120 };

describe("rankBetsByAccuracy", () => {
  it("ranks a perfect guess first with distance 0", () => {
    const ranked = rankBetsByAccuracy(
      [
        { nickname: "far", guessDate: "2026-03-01", guessWeight: 100 },
        { nickname: "perfect", guessDate: "2026-03-15", guessWeight: 120 },
      ],
      actual
    );
    expect(ranked[0].nickname).toBe("perfect");
    expect(ranked[0].distance).toBeCloseTo(0, 10);
  });

  it("orders guesses by euclidean distance of days-off and weight-off", () => {
    const ranked = rankBetsByAccuracy(
      [
        { nickname: "worst", guessDate: "2026-03-25", guessWeight: 128 }, // 10d, 8oz
        { nickname: "best", guessDate: "2026-03-16", guessWeight: 121 }, // 1d, 1oz
        { nickname: "mid", guessDate: "2026-03-18", guessWeight: 124 }, // 3d, 4oz
      ],
      actual
    );
    expect(ranked.map((r) => r.nickname)).toEqual(["best", "mid", "worst"]);
    expect(ranked[0].distance).toBeCloseTo(Math.sqrt(2), 6);
    expect(ranked[1].distance).toBeCloseTo(5, 6);
    expect(ranked[2].distance).toBeCloseTo(Math.sqrt(164), 6);
  });

  it("treats a day off and a weight unit off equally", () => {
    const ranked = rankBetsByAccuracy(
      [
        { nickname: "dateOnly", guessDate: "2026-03-18", guessWeight: 120 },
        { nickname: "weightOnly", guessDate: "2026-03-15", guessWeight: 123 },
      ],
      actual
    );
    expect(ranked[0].distance).toBeCloseTo(3, 6);
    expect(ranked[1].distance).toBeCloseTo(3, 6);
  });

  it("handles guesses before and after the actual date symmetrically", () => {
    const ranked = rankBetsByAccuracy(
      [
        { nickname: "early", guessDate: "2026-03-10", guessWeight: 120 },
        { nickname: "late", guessDate: "2026-03-20", guessWeight: 120 },
      ],
      actual
    );
    expect(ranked[0].distance).toBeCloseTo(ranked[1].distance, 10);
  });

  it("returns every guess exactly once", () => {
    const guesses = Array.from({ length: 20 }, (_, i) => ({
      nickname: `g${i}`,
      guessDate: `2026-03-${String((i % 28) + 1).padStart(2, "0")}`,
      guessWeight: 100 + i,
    }));
    const ranked = rankBetsByAccuracy(guesses, actual);
    expect(ranked).toHaveLength(20);
    expect(new Set(ranked.map((r) => r.nickname)).size).toBe(20);
    // distances must be non-decreasing
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i].distance).toBeGreaterThanOrEqual(ranked[i - 1].distance);
    }
  });
});
