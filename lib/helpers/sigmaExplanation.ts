/**
 * Demonstrates how sigma affects Gaussian curves for betting visualization
 */

// Different sigma values and their betting implications
export const SIGMA_EXAMPLES = {
  // Very confident about due date - narrow distribution
  CONFIDENT: {
    sigma: 3,
    description: "High confidence in due date prediction",
    bettingImplication:
      "Steep price differences - big penalty for being off by many days",
  },

  // Normal uncertainty - medium distribution
  NORMAL: {
    sigma: 5,
    description: "Normal uncertainty about due date",
    bettingImplication:
      "Moderate price differences - reasonable penalty for being off",
  },

  // High uncertainty - wide distribution
  UNCERTAIN: {
    sigma: 8,
    description: "High uncertainty about due date",
    bettingImplication:
      "Gentle price differences - small penalty for being off by many days",
  },
};

/**
 * Calculate probability values at different positions for visualization
 * This helps understand how sigma affects the curve shape
 */
export function demonstrateSigmaEffect() {
  const positions = [-14, -7, 0, 7, 14]; // Days from due date
  const sigmaValues = [3, 5, 8];

  console.log("How sigma affects probability at different positions:");
  console.log(
    "Position (days) | σ=3 (confident) | σ=5 (normal) | σ=8 (uncertain)"
  );
  console.log(
    "----------------|-----------------|---------------|----------------"
  );

  positions.forEach((pos) => {
    const probs = sigmaValues.map((sigma) =>
      Math.exp(-(pos ** 2) / (2 * sigma ** 2))
    );
    console.log(
      `${pos.toString().padEnd(15)} | ${probs[0]
        .toFixed(3)
        .padEnd(15)} | ${probs[1].toFixed(3).padEnd(13)} | ${probs[2].toFixed(
        3
      )}`
    );
  });
}

/**
 * For betting purposes: how to set min/max bet prices based on sigma
 */
export function calculateBetPriceRange(
  minBaseBet: number,
  maxBaseBet: number,
  sigma: number,
  dayOffset: number
): { minPrice: number; maxPrice: number; currentPrice: number } {
  // Get probability at this position (0 to 1, where 1 = peak)
  const probability = Math.exp(-(dayOffset ** 2) / (2 * sigma ** 2));

  // Inverse relationship: higher probability = higher price
  // Lower probability = lower price (better odds, cheaper bet)
  const priceMultiplier = probability;

  const currentPrice = minBaseBet + (maxBaseBet - minBaseBet) * priceMultiplier;

  return {
    minPrice: minBaseBet, // Price at the extremes (-14, +14 days)
    maxPrice: maxBaseBet, // Price at the peak (due date)
    currentPrice: Math.round(currentPrice * 100) / 100,
  };
}

/**
 * Analysis: How sigma affects price distribution when min/max are fixed
 * This demonstrates why sigma must be fixed if owners set min/max prices
 */
export function analyzeSigmaWithFixedPrices() {
  const minPrice = 5; // Price at ±14 days
  const maxPrice = 25; // Price at due date (day 0)
  const testPositions = [-14, -7, -3, 0, 3, 7, 14];
  const sigmaValues = [3, 5, 8];

  console.log("\n=== PRICE ANALYSIS WITH FIXED MIN/MAX ===");
  console.log(`Min Price: $${minPrice} (at ±14 days)`);
  console.log(`Max Price: $${maxPrice} (at due date)`);
  console.log("\nPrices at different positions:");
  console.log("Days | σ=3 Price | σ=5 Price | σ=8 Price");
  console.log("-----|-----------|-----------|----------");

  testPositions.forEach((day) => {
    const prices = sigmaValues.map((sigma) => {
      const probability = Math.exp(-(day ** 2) / (2 * sigma ** 2));
      return minPrice + (maxPrice - minPrice) * probability;
    });

    console.log(
      `${day.toString().padEnd(4)} | $${prices[0]
        .toFixed(2)
        .padEnd(8)} | $${prices[1].toFixed(2).padEnd(8)} | $${prices[2].toFixed(
        2
      )}`
    );
  });

  // Show the dramatic differences
  const day7Prices = sigmaValues.map((sigma) => {
    const probability = Math.exp(-(7 ** 2) / (2 * sigma ** 2));
    return minPrice + (maxPrice - minPrice) * probability;
  });

  console.log(`\nAt 7 days from due date:`);
  console.log(
    `σ=3: $${day7Prices[0].toFixed(2)} (${(
      (day7Prices[0] / maxPrice) *
      100
    ).toFixed(1)}% of max)`
  );
  console.log(
    `σ=5: $${day7Prices[1].toFixed(2)} (${(
      (day7Prices[1] / maxPrice) *
      100
    ).toFixed(1)}% of max)`
  );
  console.log(
    `σ=8: $${day7Prices[2].toFixed(2)} (${(
      (day7Prices[2] / maxPrice) *
      100
    ).toFixed(1)}% of max)`
  );
}

/**
 * Recommendations for fixing sigma in a betting system
 */
export const SIGMA_RECOMMENDATIONS = {
  // Conservative: Gentle price curve, fair for all bettors
  GENTLE: {
    sigma: 8,
    description: "Gentle pricing curve - small penalties for being off target",
    useCase: "When you want to be fair to all bettors, less punishing",
    priceAt7Days: "~70% of max price",
  },

  // Balanced: Moderate price curve
  BALANCED: {
    sigma: 5,
    description: "Balanced pricing curve - moderate risk/reward",
    useCase: "Good default - reasonable risk/reward balance",
    priceAt7Days: "~37% of max price",
  },

  // Aggressive: Steep price curve, high penalties
  STEEP: {
    sigma: 3,
    description: "Steep pricing curve - big penalties for being off target",
    useCase: "When you want to strongly incentivize accurate guesses",
    priceAt7Days: "~11% of max price",
  },
};

/**
 * Calculate what the price would be at any position with fixed min/max
 */
export function calculateFixedRangePrice(
  dayOffset: number,
  minPrice: number,
  maxPrice: number,
  sigma: number = 5 // Default sigma
): number {
  // Calculate probability at this position (0 to 1)
  const probability = Math.exp(-(dayOffset ** 2) / (2 * sigma ** 2));

  // Scale between min and max price
  const price = minPrice + (maxPrice - minPrice) * probability;

  return Math.round(price * 100) / 100;
}
