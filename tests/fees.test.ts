import { describe, it, expect } from "vitest";
import {
  getFeeCents,
  getTotalCents,
  PLATFORM_FEE_PERCENT,
} from "../lib/constants";

describe("donor-pays fee math", () => {
  it("adds the fee on top so the creator receives 100% of the guess", () => {
    // $100 guess: donor pays $111.11, creator gets $100.00
    expect(getFeeCents(10000)).toBe(1111);
    expect(getTotalCents(10000)).toBe(11111);
  });

  it("the fee line is exactly PLATFORM_FEE_PERCENT of the total charge", () => {
    for (const guessCents of [1000, 1500, 4267, 4500, 10000, 20000]) {
      const fee = getFeeCents(guessCents);
      const total = guessCents + fee;
      // fee should be ~10% of total (within a rounding cent)
      expect(Math.abs(fee - total * PLATFORM_FEE_PERCENT)).toBeLessThanOrEqual(1);
    }
  });

  it("round-trips: total minus fee equals the guess", () => {
    for (const guessCents of [1000, 1710, 3333, 9999]) {
      expect(getTotalCents(guessCents) - getFeeCents(guessCents)).toBe(
        guessCents
      );
    }
  });

  it("fee is always positive and monotonic in the guess price", () => {
    let prev = 0;
    for (const guessCents of [1000, 2000, 5000, 10000, 50000]) {
      const fee = getFeeCents(guessCents);
      expect(fee).toBeGreaterThan(prev);
      prev = fee;
    }
  });

  it("platform nets the fee minus Stripe processing (2.9% + 30c of total)", () => {
    const guessCents = 10000;
    const total = getTotalCents(guessCents);
    const fee = getFeeCents(guessCents);
    const stripeProcessing = Math.round(total * 0.029) + 30;
    const platformNet = fee - stripeProcessing;
    // On a $100 guess the platform should net roughly $7.59
    expect(platformNet).toBeGreaterThan(700);
    expect(platformNet).toBeLessThan(800);
  });
});
