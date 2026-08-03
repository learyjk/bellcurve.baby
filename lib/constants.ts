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
 * Donor-pays-fee model: the donor is charged the guess price plus a simple,
 * additive 10% surcharge on top, so the pool creator receives 100% of the
 * guess. No margin math — the fee is calculated directly on the base amount.
 *
 * Example ($100 guess, 10%): fee = $10.00, total = $110.00. Stripe
 * processing (2.9% + 30c of the total) comes out of the fee; the platform
 * nets the rest ($6.51 in the example).
 */
export function getFeeCents(guessCents: number): number {
  return Math.round(guessCents * PLATFORM_FEE_PERCENT);
}

export function getTotalCents(guessCents: number): number {
  return guessCents + getFeeCents(guessCents);
}
