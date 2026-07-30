import { describe, it, expect } from "vitest";
import {
  calculateSigma,
  getGuessComponentPrice,
  getGuessPrice,
} from "../lib/helpers/pricing";
import { Tables } from "../database.types";

const basePool = {
  mu_weight: 121.6, // 7.6 lbs in oz
  price_floor: 5,
  price_ceiling: 50,
  sigma_days: null,
  sigma_weight: null,
} as unknown as Tables<"pools">;

describe("calculateSigma", () => {
  it("produces a sigma where g(bound) equals the cutoff", () => {
    const sigma = calculateSigma(21, 0.01);
    const g = Math.exp(-0.5 * Math.pow(21 / sigma, 2));
    expect(g).toBeCloseTo(0.01, 6);
  });

  it("rejects cutoffs outside (0, 1)", () => {
    expect(() => calculateSigma(21, 0)).toThrow();
    expect(() => calculateSigma(21, 1)).toThrow();
    expect(() => calculateSigma(21, 1.5)).toThrow();
  });
});

describe("getGuessComponentPrice", () => {
  const cfg = { mean: 0, bound: 21, minPrice: 2.5, maxPrice: 25, sigma: 9 };

  it("returns maxPrice for a perfect guess (guess === mean)", () => {
    expect(getGuessComponentPrice({ ...cfg, guess: 0 })).toBeCloseTo(25, 6);
  });

  it("returns minPrice exactly at the bound", () => {
    expect(getGuessComponentPrice({ ...cfg, guess: 21 })).toBeCloseTo(2.5, 6);
    expect(getGuessComponentPrice({ ...cfg, guess: -21 })).toBeCloseTo(2.5, 6);
  });

  it("is symmetric around the mean", () => {
    const a = getGuessComponentPrice({ ...cfg, guess: 7 });
    const b = getGuessComponentPrice({ ...cfg, guess: -7 });
    expect(a).toBeCloseTo(b, 10);
  });

  it("decreases monotonically as the guess moves away from the mean", () => {
    const prices = [0, 3, 7, 14, 21].map((guess) =>
      getGuessComponentPrice({ ...cfg, guess })
    );
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeLessThan(prices[i - 1]);
    }
  });

  it("never goes negative or above maxPrice, even far beyond the bound", () => {
    for (const guess of [-1000, -100, -21, 0, 21, 55, 1000]) {
      const p = getGuessComponentPrice({ ...cfg, guess });
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(25 + 1e-9);
    }
  });
});

describe("getGuessPrice", () => {
  it("charges the ceiling for a perfect guess", () => {
    const { totalPrice } = getGuessPrice({
      pool: basePool,
      birthDateDeviation: 0,
      weightGuess: 121.6,
    });
    expect(totalPrice).toBeCloseTo(50, 6);
  });

  it("charges the floor for a maximally wrong guess", () => {
    const { totalPrice } = getGuessPrice({
      pool: basePool,
      birthDateDeviation: 21,
      weightGuess: 121.6 + 48,
    });
    expect(totalPrice).toBeCloseTo(5, 6);
  });

  it("accepts mu_weight in pounds and converts to ounces", () => {
    const poolLbs = { ...basePool, mu_weight: 7.6 } as Tables<"pools">;
    const oz = getGuessPrice({
      pool: basePool,
      birthDateDeviation: 5,
      weightGuess: 121.6,
    });
    const lbs = getGuessPrice({
      pool: poolLbs,
      birthDateDeviation: 5,
      weightGuess: 121.6,
    });
    expect(lbs.totalPrice).toBeCloseTo(oz.totalPrice, 10);
  });

  it("a closer guess costs more than a farther guess", () => {
    const close = getGuessPrice({
      pool: basePool,
      birthDateDeviation: 2,
      weightGuess: 124,
    });
    const far = getGuessPrice({
      pool: basePool,
      birthDateDeviation: 14,
      weightGuess: 145,
    });
    expect(close.totalPrice).toBeGreaterThan(far.totalPrice);
  });

  it("aggressive pricing charges more than chill for off-center guesses", () => {
    const aggressive = {
      ...basePool,
      sigma_days: 7,
      sigma_weight: 0.75,
    } as Tables<"pools">;
    const chill = {
      ...basePool,
      sigma_days: 11,
      sigma_weight: 1.5,
    } as Tables<"pools">;
    const a = getGuessPrice({
      pool: aggressive,
      birthDateDeviation: 10,
      weightGuess: 140,
    });
    const c = getGuessPrice({
      pool: chill,
      birthDateDeviation: 10,
      weightGuess: 140,
    });
    expect(a.totalPrice).toBeLessThan(c.totalPrice);
  });
});
