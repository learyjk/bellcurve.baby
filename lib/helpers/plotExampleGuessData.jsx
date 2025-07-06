import React from 'react';
import BetScatterPlot from './GuessScatterPlot';
import { rankBetsByAccuracy } from './rankBetsByAccuracy';

const actual = {
  actualBirthDate: '2025-12-07',
  actualWeight: 7.6,
};

const randomNames = [
  'Alice', 'Bob', 'Charlie', 'Dana', 'Eli', 'Faye', 'Gabe', 'Hana', 'Ivan', 'Jules',
  'Kira', 'Liam', 'Mona', 'Nico', 'Omar', 'Pia', 'Quinn', 'Rosa', 'Sam', 'Tess',
];

const generateExampleGuesses = () => {
  return randomNames.map((name) => {
    const daysOffset = Math.floor(Math.random() * 21) - 10; // -10 to +10 days
    const weightOffset = (Math.random() * 3) - 1.5; // -1.5 to +1.5 lbs

    const guessedDate = new Date(actual.actualBirthDate);
    guessedDate.setDate(guessedDate.getDate() + daysOffset);

    return {
      nickname: name,
      guessDate: guessedDate.toISOString().split('T')[0],
      guessWeight: parseFloat((actual.actualWeight + weightOffset).toFixed(1)),
    };
  });
};

const guessesWithoutDistance = generateExampleGuesses();
const guessesWithDistance = rankBetsByAccuracy(guessesWithoutDistance, actual);

const ExamplePlotPage: React.FC = () => {
  return (
    <div style={{ width: '100%', padding: '2rem' }}>
      <h2>Baby Bet Scatter Plot</h2>
      <BetScatterPlot guesses={guessesWithDistance} actual={actual} />
    </div>
  );
};

export default ExamplePlotPage;
