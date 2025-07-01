/**
 * Pricing style options for pool creation
 */
export const PRICING_STYLES = {
  GENTLE: {
    sigma: 8,
    name: "Gentle",
    description: "Small price differences - forgiving to all guesses",
    example: "±7 days = 70% of max price",
  },
  BALANCED: {
    sigma: 5,
    name: "Balanced",
    description: "Moderate price differences - fair risk/reward",
    example: "±7 days = 37% of max price",
  },
  STEEP: {
    sigma: 3,
    name: "Steep",
    description: "Large price differences - rewards accuracy",
    example: "±7 days = 11% of max price",
  },
} as const;

export type PricingStyle = keyof typeof PRICING_STYLES;
