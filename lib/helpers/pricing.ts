import { Tables } from "@/database.types";

/**
 * Solves for sigma in a Gaussian-like function where the value at a certain distance from the mean is known.
 * g(x) = exp(-0.5 * ((x - mu) / sigma)^2)
 * We want to find sigma such that g(bound) = cutoff.
 * @param bound The distance from the mean (mu) to the point of interest.
 * @param cutoff The desired value of the function at the bound. Should be (0, 1).
 * @returns The calculated sigma.
 */
export function calculateSigma(bound: number, cutoff: number = 0.01): number {
  if (cutoff <= 0 || cutoff >= 1) {
    throw new Error("Cutoff must be between 0 and 1.");
  }
  // From g(bound) = cutoff, we can derive:
  // -0.5 * (bound / sigma)^2 = ln(cutoff)
  // (bound / sigma)^2 = -2 * ln(cutoff)
  // bound / sigma = sqrt(-2 * ln(cutoff))
  // sigma = bound / sqrt(-2 * ln(cutoff))
  return bound / Math.sqrt(-2 * Math.log(cutoff));
}

interface BetComponentPriceInput {
  guess: number;
  mean: number;
  bound: number;
  minPrice: number;
  maxPrice: number;
  cutoff?: number;
}

/**
 * Calculates the price of a single component of a bet (e.g., date or weight)
 * based on a Gaussian distribution.
 * @param input The input parameters for the price calculation.
 * @returns The calculated price for the component.
 */
export function getBetComponentPrice(input: BetComponentPriceInput): number {
  const { guess, mean, bound, minPrice, maxPrice, cutoff } = input;

  const sigma = calculateSigma(bound, cutoff);

  const premium = maxPrice - minPrice;

  // Gaussian function scaled to [0, 1]
  const gaussianValue = Math.exp(-0.5 * Math.pow((guess - mean) / sigma, 2));

  return minPrice + premium * gaussianValue;
}

interface BetPriceInput {
  pool: Tables<"pools">;
  birthDateDeviation: number;
  weightGuess: number;
}

/**
 * Calculates the total price of a bet by summing the prices of its components.
 * @param input The input parameters for the bet price calculation.
 * @returns The total calculated price for the bet.
 */
export function getBetPrice(input: BetPriceInput): {
  totalPrice: number;
  datePrice: number;
  weightPrice: number;
} {
  const { pool, birthDateDeviation, weightGuess } = input;

  // Pricing constants from the pool
  const minBetPrice = pool.price_floor ?? 5;
  const maxBetPrice = pool.price_ceiling ?? 50;
  const meanWeight = pool.mu_weight ?? 7.6;

  // Each component gets half the price range
  const minComponentPrice = minBetPrice / 2;
  const maxComponentPrice = maxBetPrice / 2;

  const datePrice = getBetComponentPrice({
    guess: birthDateDeviation,
    mean: 0,
    bound: 14, // 2 weeks in days
    minPrice: minComponentPrice,
    maxPrice: maxComponentPrice,
  });

  const weightPrice = getBetComponentPrice({
    guess: weightGuess,
    mean: meanWeight,
    bound: 2, // 2 lbs
    minPrice: minComponentPrice,
    maxPrice: maxComponentPrice,
  });

  return { totalPrice: datePrice + weightPrice, datePrice, weightPrice };
}
