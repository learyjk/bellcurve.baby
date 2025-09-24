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
import { ymdToUtcNoon } from "@/lib/helpers/date";

// Helper to format weight from total ounces to lbs and oz
const formatWeight = (totalOunces: number) => {
  if (totalOunces === null || totalOunces === undefined) return "";
  const pounds = Math.floor(totalOunces / 16);
  const ounces = Math.round(totalOunces % 16);
  return `${pounds} lbs ${ounces} oz`;
};

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

interface DataPoint {
  x: number;
  y: number;
  nickname: string;
  rank: number;
  distance: number;
  displayDate: string;
  displayWeight: number;
}

interface CustomScatterShapeProps {
  cx: number;
  cy: number;
  payload: DataPoint;
  index?: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: DataPoint }>;
}

const BetScatterPlot: React.FC<BetPlotProps> = ({ guesses, actual }) => {
  const actualDate = ymdToUtcNoon(actual.actualBirthDate).getTime();

  // Sort guesses by distance to actual (best first)
  const sortedGuesses = [...guesses].sort((a, b) => a.distance - b.distance);



  const data: DataPoint[] = sortedGuesses.map((guess, index) => {
    const guessDate = ymdToUtcNoon(guess.guessDate).getTime();

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

  const CustomScatterShape: React.FC<CustomScatterShapeProps> = ({
    cx,
    cy,
    payload,
  }) => {
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
      return <circle cx={cx} cy={cy} r={4} fill="#bbb" stroke="none" />;
    }
  };

  const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const { nickname, displayDate, displayWeight, rank } = payload[0].payload;
      return (
        <div
          style={{
            backgroundColor: "#fff",
            border: "1px solid #ccc",
            padding: "6px",
            borderRadius: "4px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            fontFamily: "JetBrains Mono, monospace",
            fontSize: "11px",
          }}
        >
          <div>
            <strong>{nickname}</strong> (Rank #{rank})
          </div>
          <div>Date: {new Date(displayDate).toLocaleDateString()}</div>
          <div>Weight: {formatWeight(displayWeight)}</div>
        </div>
      );
    }
    return null;
  };

  // Custom shape for actual point
  const ActualShape: React.FC<{ cx: number; cy: number }> = ({ cx, cy }) => (
    <circle r={10} fill="#f00" stroke="#000" strokeWidth={2} cx={cx} cy={cy} />
  );

  return (
    <div className="font-mono">
      <ResponsiveContainer width="100%" height={520}>
      <ScatterChart margin={{ top: 40, right: 50, left: 90, bottom: 70 }}>
        <XAxis
          type="number"
          dataKey="x"
          domain={["auto", "auto"]}
          tick={{
            fontSize: "10px",
            fontFamily: "JetBrains Mono, monospace",
            fill: "#666"
          }}
          tickFormatter={(tick) => new Date(tick).toLocaleDateString()}
        >
          <Label
            value="Birth Date"
            offset={-20}
            position="insideBottom"
            style={{
              textAnchor: "middle",
              fontSize: "10px",
              fontFamily: "JetBrains Mono, monospace",
              fill: "#666"
            }}
          />
        </XAxis>

        <YAxis
          type="number"
          dataKey="y"
          domain={["auto", "auto"]}
          width={80}
          tick={{
            fontSize: "10px",
            fontFamily: "JetBrains Mono, monospace",
            fill: "#666"
          }}
          tickFormatter={(tick) => {
            const pounds = Math.floor(tick / 16);
            const ounces = Math.round(tick % 16);
            if (ounces === 0) {
              return `${pounds}lb`;
            } else {
              return `${pounds}lb${ounces}oz`;
            }
          }}
          label={{
            value: "Birth Weight",
            angle: -90,
            position: "insideLeft",
            offset: 20,
            style: {
              textAnchor: "middle",
              fontSize: "10px",
              fontFamily: "JetBrains Mono, monospace",
              fill: "#666"
            },
          }}
        />

        {/* Reference lines for actual birth date and weight */}
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
