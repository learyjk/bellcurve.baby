import { ymdToUtcNoon } from "@/lib/helpers/date";

interface Guess {
  nickname: string;
  guessDate: string;
  guessWeight: number;
}

interface ActualOutcome {
  actualBirthDate: string;
  actualWeight: number;
}

export function rankBetsByAccuracy(
  guesses: Guess[],
  actual: ActualOutcome
): {
  nickname: string;
  guessDate: string;
  guessWeight: number;
  distance: number;
}[] {
  // Use UTC-noon representation for YMD strings to avoid timezone shifts
  // when converting to milliseconds.
  const actualDate = ymdToUtcNoon(actual.actualBirthDate).getTime();

  return guesses
    .map((guess) => {
      const guessDateValue = ymdToUtcNoon(guess.guessDate).getTime();
      const dateDiffDays =
        (guessDateValue - actualDate) / (1000 * 60 * 60 * 24);

      const weightDiff = guess.guessWeight - actual.actualWeight;

      const distance = Math.sqrt(
        Math.pow(dateDiffDays, 2) + Math.pow(weightDiff, 2)
      );

      return {
        nickname: guess.nickname,
        guessDate: guess.guessDate,
        guessWeight: guess.guessWeight,
        distance: distance,
      };
    })
    .sort((a, b) => a.distance - b.distance);
}
