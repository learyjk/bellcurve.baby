import { Tables } from "@/database.types";

/**
 * Calculate bet price using pool-specific pricing configuration
 * Uses the pool's min/max prices and sigma values
 * 50/50 weighting: each component contributes up to half the max price
 */
export function getBetPriceFromPool({
  dayOffset,
  weightLbs,
  pool,
}: {
  dayOffset: number;
  weightLbs: number;
  pool: Pick<
    Tables<"pools">,
    | "price_floor"
    | "price_ceiling"
    | "sigma_days"
    | "mu_weight"
    | "sigma_weight"
  >;
}): number {
  const priceFloor = pool.price_floor ?? 5;
  const priceCeiling = pool.price_ceiling ?? 25;
  const sigmaDay = pool.sigma_days ?? 5;
  const muWeight = pool.mu_weight ?? 7.6;
  const sigmaWeight = pool.sigma_weight ?? 0.75;

  // Each component can contribute up to half the price range
  const halfRange = (priceCeiling - priceFloor) / 2;

  // Date and weight probabilities (0 to 1)
  const dateProbability = Math.exp(-(dayOffset ** 2) / (2 * sigmaDay ** 2));
  const weightProbability = Math.exp(
    -((weightLbs - muWeight) ** 2) / (2 * sigmaWeight ** 2)
  );

  // Each component's contribution
  const dateComponent = halfRange * dateProbability;
  const weightComponent = halfRange * weightProbability;

  // Total price
  const price = priceFloor + dateComponent + weightComponent;
  return Math.round(price * 100) / 100;
}

/**
 * Legacy function - kept for backward compatibility
 * @deprecated Use getBetPriceFromPool instead
 */
export function getBetPrice({
  dayOffset, // -14 to +14
  weightLbs, // average baby weight in lbs +/- 2 on either side.
  muDay = 0, // peak at due date
  sigmaDay = 5,
  muWeight = 7.6, // peak at avg baby weight. Change to avg of father + mother weights?
  sigmaWeight = 0.75,
  basePrice = 5,
  maxPremium = 20, // how much extra for perfect bet
}: {
  dayOffset: number;
  weightLbs: number;
  muDay?: number;
  sigmaDay?: number;
  muWeight?: number;
  sigmaWeight?: number;
  basePrice?: number;
  maxPremium?: number;
}): number {
  const datePrice = Math.exp(-((dayOffset - muDay) ** 2) / (2 * sigmaDay ** 2));
  const weightPrice = Math.exp(
    -((weightLbs - muWeight) ** 2) / (2 * sigmaWeight ** 2)
  );
  const totalPremium = maxPremium * datePrice * weightPrice;
  return +(basePrice + totalPremium).toFixed(2);
}
