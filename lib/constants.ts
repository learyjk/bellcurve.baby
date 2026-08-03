export const DATE_DEVIATION_DAYS = 21;
export const WEIGHT_DEVIATION_OUNCES = 48; // 3 lbs

// --- Payments ---
// Platform fee: 10% of each guess goes to bellcurve.baby; the pool creator
// keeps 90%. Stripe's card processing fee is separate (paid by the platform
// on destination charges).
export const PLATFORM_FEE_PERCENT = 0.1;

// Price range limits for pools. Pool creators can set their own min/max
// guess prices within these bounds.
export const MIN_PRICE_FLOOR = 10; // creators cannot set a floor below this
export const MAX_PRICE_CEILING = 200; // ...nor a ceiling above this
export const DEFAULT_PRICE_FLOOR = 15;
export const DEFAULT_PRICE_CEILING = 60;

/**
 * Donor-pays-fee model: the donor is charged the guess price plus a fee on
 * top, so the pool creator receives 100% of their guess. The fee line shown
 * at checkout is PLATFORM_FEE_PERCENT of the TOTAL charge, so it must be
 * computed from the guess price as p/(1-r) - p (equivalently total = p/(1-r)).
 *
 * Example ($100 guess, 10%): total = $111.11, fee = $11.11 (= 10% of total),
 * Stripe processing ($3.52) comes out of the fee; platform nets the rest.
 */
export function getFeeCents(guessCents: number): number {
  return Math.round(guessCents / (1 - PLATFORM_FEE_PERCENT)) - guessCents;
}

export function getTotalCents(guessCents: number): number {
  return guessCents + getFeeCents(guessCents);
}
