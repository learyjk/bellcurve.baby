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
