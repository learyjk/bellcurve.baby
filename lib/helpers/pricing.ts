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
  return bound / Math.sqrt(-2 * Math.log(cutoff));
}

interface BetComponentPriceInput {
  guess: number;
  mean: number;
  bound: number;
  minPrice: number;
  maxPrice: number;
  sigma?: number;
  cutoff?: number;
}

/**
 * Calculates the price of a single component of a bet (e.g., date or weight)
 * based on a normalized Gaussian distribution.
 * Ensures that the minPrice occurs exactly at the specified bound.
 * @param input The input parameters for the price calculation.
 * @returns The calculated price for the component.
 */
export function getBetComponentPrice(input: BetComponentPriceInput): number {
  const { guess, mean, bound, minPrice, maxPrice, sigma, cutoff = 0.01 } = input;

  const effectiveSigma = sigma !== undefined ? sigma : calculateSigma(bound, cutoff);

  const expExtreme = Math.exp(-0.5 * Math.pow(bound / effectiveSigma, 2));
  const expGuess = Math.exp(-0.5 * Math.pow((guess - mean) / effectiveSigma, 2));

  const normalizedGaussian = (expGuess - expExtreme) / (1 - expExtreme);

  const price = minPrice + (maxPrice - minPrice) * normalizedGaussian;

  return price;
}

interface BetPriceInput {
  pool: Tables<"pools">;
  birthDateDeviation: number;
  weightGuess: number;
  pricingModel?: 'aggressive' | 'standard' | 'chill';
}

/**
 * Calculates the total price of a bet by summing the prices of its components.
 * Each component is calculated using a normalized Gaussian.
 * @param input The input parameters for the bet price calculation.
 * @returns The total calculated price for the bet.
 */
export function getBetPrice(input: BetPriceInput): {
  totalPrice: number;
  datePrice: number;
  weightPrice: number;
} {
  const { pool, birthDateDeviation, weightGuess, pricingModel = 'standard' } = input;

  const minBetPrice = pool.price_floor ?? 5;
  const maxBetPrice = pool.price_ceiling ?? 50;
  const meanWeight = pool.mu_weight ?? 7.6;

  const minComponentPrice = minBetPrice / 2;
  const maxComponentPrice = maxBetPrice / 2;

  let dateSigma: number;
  let weightSigma: number;

  switch (pricingModel) {
    case 'aggressive':
      dateSigma = 3;
      weightSigma = 0.4;
      break;
    case 'chill':
      dateSigma = 7;
      weightSigma = 1.0;
      break;
    case 'standard':
    default:
      dateSigma = 5;
      weightSigma = 0.75;
      break;
  }

  const datePrice = getBetComponentPrice({
    guess: birthDateDeviation,
    mean: 0,
    bound: 14,
    minPrice: minComponentPrice,
    maxPrice: maxComponentPrice,
    sigma: dateSigma,
  });

  const weightPrice = getBetComponentPrice({
    guess: weightGuess,
    mean: meanWeight,
    bound: 2,
    minPrice: minComponentPrice,
    maxPrice: maxComponentPrice,
    sigma: weightSigma,
  });

  return {
    totalPrice: datePrice + weightPrice,
    datePrice,
    weightPrice,
  };
}
