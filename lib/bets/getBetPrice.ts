export function getBetPrice({
  dayOffset, // -14 to +14
  weightLbs, // 5 to 9
  muDay = 0, // peak at due date
  sigmaDay = 5,
  muWeight = 7.6, // peak at avg baby weight
  sigmaWeight = 0.5,
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
