import React from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Label,
  ReferenceLine,
} from "recharts";

export interface Guess {
  name: string;
  guessed_birth_date: string;
  guessed_weight: number;
  distance: number;
}

export interface ActualOutcome {
  actualBirthDate: string;
  actualWeight: number;
}

interface BetScatterPlotProps {
  guesses: Guess[];
  actual: ActualOutcome;
}

const BetScatterPlot: React.FC<BetScatterPlotProps> = ({ guesses, actual }) => {
  const actualDate = new Date(actual.actualBirthDate).getTime();

  // Sort guesses by distance to actual
  const sortedGuesses = [...guesses].sort((a, b) => a.distance - b.distance);

  const data = sortedGuesses.map((guess, index) => {
    const guessDate = new Date(guess.guessed_birth_date).getTime();
    return {
      x: guessDate,
      y: guess.guessed_weight,
      name: guess.name,
      rank: index + 1,
      distance: guess.distance,
      displayDate: guess.guessed_birth_date,
      displayWeight: guess.guessed_weight,
    };
  });

  const actualPoint = {
    x: actualDate,
    y: actual.actualWeight,
  };

  // Custom shape for guesses, highlight top 3
 const CustomScatterShape = ({ cx, cy, payload }: CustomScatterShapeProps) => {
  if (payload.rank === 1) {
    // Gold (winner)
    return (
      <circle
        cx={cx}
        cy={cy}
        r={6}
        fill="#FFD700"
        stroke="#222"
        strokeWidth={1.5}
      />
    );
  } else if (payload.rank === 2) {
    // Silver
    return (
      <circle
        cx={cx}
        cy={cy}
        r={6}
        fill="#C0C0C0"
        stroke="#222"
        strokeWidth={1.5}
      />
    );
  } else if (payload.rank === 3) {
    // Bronze
    return (
      <circle
        cx={cx}
        cy={cy}
        r={6}
        fill="#CD7F32"
        stroke="#222"
        strokeWidth={1.5}
      />
    );
  } else {
    // Less prominent: smaller, gray, no outline
    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill="#bbb"
        stroke="none"
      />
    );
  }
};
      />
    );
  };

  // Custom tooltip for displaying guess details
  interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{ payload: (typeof data)[number] }>;
  }
  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const { name, displayDate, displayWeight, rank } = payload[0].payload;
      return (
        <div
          style={{
            backgroundColor: "#fff",
            border: "1px solid #ccc",
            padding: 8,
          }}
        >
          <div>
            <strong>{name}</strong> (Rank #{rank})
          </div>
          <div>Date: {new Date(displayDate).toLocaleDateString()}</div>
          <div>Weight: {displayWeight} lbs</div>
        </div>
      );
    }
    return null;
  };

  // Custom shape for actual point
  const ActualShape: React.FC<{ cx: number; cy: number }> = (props) => (
    <circle
      r={10}
      fill="#f00"
      stroke="#000"
      strokeWidth={2}
      cx={props.cx}
      cy={props.cy}
    />
  );

  return (
    <ResponsiveContainer width="100%" height={420}>
      <ScatterChart margin={{ top: 20, right: 30, left: 30, bottom: 40 }}>
        <XAxis
          type="number"
          dataKey="x"
          domain={["auto", "auto"]}
          tickFormatter={(tick) => new Date(tick).toLocaleDateString()}
        >
          <Label
            value="Birth Date"
            offset={-10}
            position="insideBottom"
            style={{ textAnchor: "middle" }}
          />
        </XAxis>
        <YAxis
          type="number"
          dataKey="y"
          domain={["auto", "auto"]}
          label={{
            value: "Birth Weight (lbs)",
            angle: -90,
            position: "insideLeft",
            offset: 10,
            style: { textAnchor: "middle" },
          }}
        />
        <ReferenceLine x={actualPoint.x} stroke="#f00" strokeDasharray="3 3" />
        <ReferenceLine y={actualPoint.y} stroke="#f00" strokeDasharray="3 3" />
        <Scatter
          name="Guesses"
          data={data}
          shape={(props: unknown) => (
            <CustomScatterShape {...(props as CustomScatterShapeProps)} />
          )}
        />
        <Scatter
          name="Actual"
          data={[actualPoint]}
          fill="#f00"
          shape={(props: unknown) => (
            <ActualShape {...(props as { cx: number; cy: number })} />
          )}
        />
        <Tooltip content={<CustomTooltip />} isAnimationActive={false} />
      </ScatterChart>
    </ResponsiveContainer>
  );
};

export default BetScatterPlot;
