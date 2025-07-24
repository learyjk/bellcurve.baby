import { Tables } from "@/database.types";
import { pricingModelSigmas } from "@/lib/helpers/pricingModels";
import { DATE_DEVIATION_DAYS, WEIGHT_DEVIATION_OUNCES } from "@/lib/constants";

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

type GuessComponentPriceInput = {
  guess: number;
  mean: number;
  bound: number;
  minPrice: number;
  maxPrice: number;
  sigma?: number;
  cutoff?: number;
};

/**
 * Calculates the price of a single component of a guess (e.g., date or weight)
 * based on a normalized Gaussian distribution.
 * Ensures that the minPrice occurs exactly at the specified bound.
 * @param input The input parameters for the price calculation.
 * @returns The calculated price for the component.
 */
export function getGuessComponentPrice(
  input: GuessComponentPriceInput
): number {
  const {
    guess,
    mean,
    bound,
    minPrice,
    maxPrice,
    sigma,
    cutoff = 0.01,
  } = input;

  const effectiveSigma =
    sigma !== undefined ? sigma : calculateSigma(bound, cutoff);

  const expExtreme = Math.exp(-0.5 * Math.pow(bound / effectiveSigma, 2));
  const expGuess = Math.exp(
    -0.5 * Math.pow((guess - mean) / effectiveSigma, 2)
  );

  const normalizedGaussian = (expGuess - expExtreme) / (1 - expExtreme);

  const price = minPrice + (maxPrice - minPrice) * normalizedGaussian;

  return price;
}

export type GuessPriceInput = {
  pool: Tables<"pools">;
  birthDateDeviation: number;
  weightGuess: number;
  pricingModel?: keyof typeof pricingModelSigmas;
};

/**
 * Calculates the total price of a guess by summing the prices of its components.
 */
export function getGuessPrice(input: GuessPriceInput) {
  const { pool, birthDateDeviation, weightGuess } = input;

  // Ensure pool properties have fallbacks
  let mu_weight = pool.mu_weight ?? 121.6; // 7.6 lbs in oz
  const price_floor = pool.price_floor ?? 5;
  const price_ceiling = pool.price_ceiling ?? 50;
  const sigma_days = pool.sigma_days ?? 4;
  let sigma_weight = pool.sigma_weight ?? 0.6; // in lbs

  // If mu_weight is in lbs, convert to oz
  if (mu_weight < 30) {
    mu_weight = mu_weight * 16;
  }

  // Convert sigma_weight from lbs to oz
  sigma_weight = sigma_weight * 16;

  const minComponentPrice = price_floor / 2;
  const maxComponentPrice = price_ceiling / 2;

  const datePrice = getGuessComponentPrice({
    guess: birthDateDeviation,
    mean: 0,
    bound: DATE_DEVIATION_DAYS,
    minPrice: minComponentPrice,
    maxPrice: maxComponentPrice,
    sigma: sigma_days,
  });

  const weightPrice = getGuessComponentPrice({
    guess: weightGuess, // already in ounces
    mean: mu_weight, // already in ounces
    bound: WEIGHT_DEVIATION_OUNCES,
    minPrice: minComponentPrice,
    maxPrice: maxComponentPrice,
    sigma: sigma_weight, // already in ounces
  });

  const totalPrice = datePrice + weightPrice;

  return {
    totalPrice,
    datePrice,
    weightPrice,
  };
}
