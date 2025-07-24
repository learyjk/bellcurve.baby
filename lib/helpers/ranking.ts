export interface Guess {
  name: string;
  guessDate: string;
  guessWeight: number;
  guess_id: string;
}

export interface ActualOutcome {
  actualBirthDate: string;
  actualWeight: number;
}

export function rankGuessesByAccuracy(
  guesses: Guess[],
  actual: ActualOutcome
): {
  name: string;
  guessDate: string;
  guessWeight: number;
  distance: number;
  guess_id: string;
}[] {
  const actualDate = new Date(actual.actualBirthDate).getTime();

  return guesses
    .map((guess) => {
      const guessDateValue = new Date(guess.guessDate).getTime();
      const dateDiffDays =
        (guessDateValue - actualDate) / (1000 * 60 * 60 * 24);

      const weightDiff = guess.guessWeight - actual.actualWeight;

      const distance = Math.sqrt(
        Math.pow(dateDiffDays, 2) + Math.pow(weightDiff, 2)
      );

      return {
        name: guess.name,
        guessDate: guess.guessDate,
        guessWeight: guess.guessWeight,
        distance: distance,
        guess_id: guess.guess_id,
      };
    })
    .sort((a, b) => a.distance - b.distance);
}
