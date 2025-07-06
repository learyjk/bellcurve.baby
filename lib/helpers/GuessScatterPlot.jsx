import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Label } from 'recharts';

interface Guess {
  nickname: string;
  guessDate: string;
  guessWeight: number;
  distance: number;
}

interface ActualOutcome {
  actualBirthDate: string;
  actualWeight: number;
}

interface BetPlotProps {
  guesses: Guess[];
  actual: ActualOutcome;
}

const BetScatterPlot: React.FC<BetPlotProps> = ({ guesses, actual }) => {
  const actualDate = new Date(actual.actualBirthDate).getTime();

  const data = guesses.map((guess, index) => {
    const guessDate = new Date(guess.guessDate).getTime();

    return {
      x: guessDate,
      y: guess.guessWeight,
      nickname: guess.nickname,
      rank: index + 1,
      distance: guess.distance,
      displayDate: guess.guessDate,
      displayWeight: guess.guessWeight,
    };
  });

  const actualPoint = {
    x: actualDate,
    y: actual.actualWeight,
  };

  const CustomScatterShape = (props: any) => {
    const { cx, cy, index } = props;

    let fillColor = '#555';
    if (index === 0) fillColor = '#FFD700';
    else if (index === 1) fillColor = '#C0C0C0';
    else if (index === 2) fillColor = '#CD7F32';

    return <circle cx={cx} cy={cy} r={5} fill={fillColor} />;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const { nickname, displayDate, displayWeight } = payload[0].payload;
      return (
        <div style={{ backgroundColor: '#fff', border: '1px solid #ccc', padding: '5px' }}>
          <div><strong>{nickname}</strong></div>
          <div>Date: {new Date(displayDate).toLocaleDateString()}</div>
          <div>Weight: {displayWeight} lbs</div>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ScatterChart>
        <XAxis
          type="number"
          dataKey="x"
          domain={['auto', 'auto']}
          tickFormatter={(tick) => new Date(tick).toLocaleDateString()}
        >
          <Label value="Birth Date" offset={0} position="bottom" />
        </XAxis>

        <YAxis
          type="number"
          dataKey="y"
          domain={['auto', 'auto']}
          label={{ value: 'Birth Weight (lbs)', angle: -90, position: 'insideLeft' }}
        />

        <Scatter name="Guesses" data={data} shape={<CustomScatterShape />} />

        <Scatter name="Actual" data={[actualPoint]} fill="#000" shape={<circle r={8} fill="#000" />} />

        <Tooltip content={<CustomTooltip />} />
      </ScatterChart>
    </ResponsiveContainer>
  );
};

export default BetScatterPlot;
