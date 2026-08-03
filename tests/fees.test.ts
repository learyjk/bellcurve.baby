import { describe, it, expect } from "vitest";
import {
  getFeeCents,
  getTotalCents,
  PLATFORM_FEE_PERCENT,
} from "../lib/constants";

describe("donor-pays fee math (additive surcharge)", () => {
  it("adds an additive 10% surcharge on top of the base donation", () => {
    // $100 base: fee = $10.00, total = $110.00
    expect(getFeeCents(10000)).toBe(1000);
    expect(getTotalCents(10000)).toBe(11000);
  });

  it("the fee is exactly PLATFORM_FEE_PERCENT of the BASE donation", () => {
    for (const guessCents of [1000, 1500, 4267, 4500, 10000, 20000]) {
      const fee = getFeeCents(guessCents);
      expect(fee).toBe(Math.round(guessCents * PLATFORM_FEE_PERCENT));
    }
  });

  it("total charge = base + fee", () => {
    for (const guessCents of [1000, 1710, 3333, 9999]) {
      expect(getTotalCents(guessCents)).toBe(
        guessCents + getFeeCents(guessCents)
      );
    }
  });

  it("platform nets fee minus Stripe processing (2.9% + 30c of gross)", () => {
    // $100 example from the spec: Stripe takes $3.49, platform nets $6.51
    const guessCents = 10000;
    const total = getTotalCents(guessCents);
    const fee = getFeeCents(guessCents);
    const stripeFee = Math.round(total * 0.029) + 30;
    expect(stripeFee).toBe(349);
    expect(fee - stripeFee).toBe(651);
  });

  it("fee is always positive and monotonic in the guess price", () => {
    let prev = 0;
    for (const guessCents of [1000, 2000, 5000, 10000, 50000]) {
      const fee = getFeeCents(guessCents);
      expect(fee).toBeGreaterThan(prev);
      prev = fee;
    }
  });
});
