/**
 * Helper functions for Gaussian curve calculations and visualizations
 */

/**
 * Calculate the probability density for a given date offset using a normalized Gaussian distribution
 * @param dateOffset - Days from due date (-14 to +14)
 * @param mu - Mean (peak) of the distribution (default: 0 = due date)
 * @param sigma - Standard deviation of the distribution (default: 5)
 * @returns Normalized probability density (0 to 1)
 */
export function getPriceForDateBet(
  dateOffset: number,
  mu: number = 0,
  sigma: number = 5
): number {
  // Calculate the Gaussian probability density function
  const probability = Math.exp(-((dateOffset - mu) ** 2) / (2 * sigma ** 2));

  // This is already normalized to peak at 1 when dateOffset = mu
  return probability;
}

/**
 * Generate data points for rendering a Gaussian curve
 * @param min - Minimum x value
 * @param max - Maximum x value
 * @param steps - Number of data points to generate
 * @param mu - Mean of the distribution
 * @param sigma - Standard deviation of the distribution
 * @returns Array of {x, y} points for the curve
 */
export function generateGaussianCurveData(
  min: number = -14,
  max: number = 14,
  steps: number = 100,
  mu: number = 0,
  sigma: number = 5
): Array<{ x: number; y: number }> {
  const stepSize = (max - min) / (steps - 1);
  const data: Array<{ x: number; y: number }> = [];

  for (let i = 0; i < steps; i++) {
    const x = min + i * stepSize;
    const y = getPriceForDateBet(x, mu, sigma);
    data.push({ x, y });
  }

  return data;
}

/**
 * Calculate the percentage area under the curve within a given range
 * This helps show what percentage of births typically occur within the selected range
 * @param centerPoint - The center point of the range
 * @param rangeWidth - Width of the range (total width, not half-width)
 * @param mu - Mean of the distribution
 * @param sigma - Standard deviation of the distribution
 * @returns Approximate percentage (0-100)
 */
export function calculateAreaUnderCurve(
  centerPoint: number,
  rangeWidth: number,
  mu: number = 0,
  sigma: number = 5
): number {
  const halfWidth = rangeWidth / 2;
  const lowerBound = centerPoint - halfWidth;
  const upperBound = centerPoint + halfWidth;

  // Simple numerical integration using the trapezoidal rule
  const steps = 100;
  const stepSize = (upperBound - lowerBound) / steps;
  let area = 0;

  for (let i = 0; i < steps; i++) {
    const x1 = lowerBound + i * stepSize;
    const x2 = lowerBound + (i + 1) * stepSize;
    const y1 = getPriceForDateBet(x1, mu, sigma);
    const y2 = getPriceForDateBet(x2, mu, sigma);

    // Trapezoidal rule
    area += ((y1 + y2) * stepSize) / 2;
  }

  // Convert to percentage (approximate)
  // The total area under a normalized Gaussian from -∞ to +∞ would be sqrt(2π) * sigma
  // But since we're working with a truncated range and normalized peak, we'll use an approximation
  const totalApproxArea = Math.sqrt(2 * Math.PI) * sigma;
  const percentage = (area / totalApproxArea) * 100;

  // Clamp to reasonable bounds
  return Math.min(100, Math.max(0, percentage));
}
