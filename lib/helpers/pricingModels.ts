// Pricing model sigma presets for use throughout the app

export type PricingModel = "aggressive" | "standard" | "chill";

export const pricingModelSigmas: Record<
  PricingModel,
  { dateSigma: number; weightSigma: number }
> = {
  aggressive: { dateSigma: 3, weightSigma: 0.4 },
  standard: { dateSigma: 5, weightSigma: 0.75 },
  chill: { dateSigma: 7, weightSigma: 1.0 },
};
