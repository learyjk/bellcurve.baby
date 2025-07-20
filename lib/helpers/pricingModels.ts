// Pricing model sigma presets for use throughout the app.

export type PricingModel = "aggressive" | "standard" | "chill";

export const pricingModelSigmas: Record<
  PricingModel,
  { dateSigma: number; weightSigma: number }
> = {
  aggressive: { dateSigma: 7, weightSigma: 0.75 },
  standard: { dateSigma: 9, weightSigma: 1.25 },
  chill: { dateSigma: 11, weightSigma: 1.5 },
};
