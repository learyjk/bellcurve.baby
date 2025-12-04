import React, { useRef, useEffect, useState, useMemo } from "react";
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

// Helper to format date - treat YYYY-MM-DD as local date, no timezone conversions
const formatDateForDisplay = (dateStr: string): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    // Parse as local date, not UTC
    const dt = new Date(y, mo - 1, d);
    return dt.toLocaleDateString();
  }
  // Fallback for non-YYYY-MM-DD format
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString();
  }
  return dateStr;
};

export interface Guess {
  name: string;
  guessed_birth_date: string;
  guessed_weight: number;
  distance: number;
  place?: number;
  id?: string;
}

export interface ActualOutcome {
  actualBirthDate: string;
  actualWeight: number;
}

interface GuessScatterPlotProps {
  guesses: Guess[];
  actual: ActualOutcome;
  hoveredGuessId?: string | null;
}

const GuessScatterPlot: React.FC<GuessScatterPlotProps> = ({
  guesses,
  actual,
  hoveredGuessId,
}) => {
  const actualDate = ymdToUtcNoon(actual.actualBirthDate).getTime();

  // Combine all guesses into a single array, sorted by place (lower place = better = render last = on top)
  // This ensures Recharts only includes the actual hovered point in the payload
  const allGuessesData = useMemo(() => {
    return guesses
      .map((guess) => {
        const guessDate = ymdToUtcNoon(guess.guessed_birth_date).getTime();
        const id = guess.id || `${guess.name}-${guess.guessed_birth_date}-${guess.guessed_weight}`;
        return {
          x: guessDate,
          y: guess.guessed_weight,
          name: guess.name,
          place: guess.place || 999,
          distance: guess.distance,
          displayDate: guess.guessed_birth_date,
          displayWeight: guess.guessed_weight,
          id,
          isHovered: hoveredGuessId === id,
        };
      })
      // Sort by place descending (higher places first in array, so they render last = on top)
      // Order: others (999), 4th, 3rd, 2nd, 1st
      // This ensures: others render first (bottom), bronze renders above, silver above bronze, gold on top
      .sort((a, b) => {
        const placeA = a.place || 999;
        const placeB = b.place || 999;
        const placeDiff = placeB - placeA; // Descending: higher place numbers first
        if (placeDiff !== 0) return placeDiff;
        return (a.distance || 0) - (b.distance || 0); // For ties, sort by distance ascending
      });
  }, [guesses, hoveredGuessId]);

  // Find hovered guess data for custom tooltip - memoize to prevent infinite loops
  const hoveredData = useMemo(() => {
    if (!hoveredGuessId) return null;
    return allGuessesData.find((d) => d.id === hoveredGuessId) || null;
  }, [hoveredGuessId, allGuessesData]);

  const actualPoint = {
    x: actualDate,
    y: actual.actualWeight,
    name: "Actual",
    displayDate: actual.actualBirthDate,
    displayWeight: actual.actualWeight,
    isActual: true,
  };

  // Custom shape for guesses, highlight top 3
  interface CustomScatterShapeProps {
    cx: number;
    cy: number;
    payload: {
      place: number;
      name: string;
      displayDate: string;
      displayWeight: number;
      distance: number;
      id: string;
      isHovered: boolean;
    };
    index?: number;
  }
  const CustomScatterShape = ({ cx, cy, payload }: CustomScatterShapeProps) => {
    const baseRadius = payload.place <= 3 ? 6 : 4;
    const radius = payload.isHovered ? baseRadius + 3 : baseRadius;
    const strokeWidth = payload.isHovered ? 3 : payload.place <= 3 ? 1.5 : 0;
    const strokeColor = payload.isHovered ? "#000" : "#222";

    if (payload.place === 1) {
      // Gold (winner) - can be multiple if tied
      return (
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="#FFD700"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      );
    } else if (payload.place === 2) {
      // Silver - can be multiple if tied
      return (
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="#C0C0C0"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      );
    } else if (payload.place === 3) {
      // Bronze - can be multiple if tied
      return (
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="#CD7F32"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      );
    } else {
      // Less prominent: smaller, gray, no outline
      return (
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill={payload.isHovered ? "#888" : "#bbb"}
          stroke={payload.isHovered ? strokeColor : "none"}
          strokeWidth={strokeWidth}
        />
      );
    }
  };

  // Custom tooltip for displaying guess details
  interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{
      payload: {
        x?: number;
        y?: number;
        place?: number;
        name: string;
        displayDate: string;
        displayWeight: number;
        distance?: number;
        id?: string;
        isHovered?: boolean;
        isActual?: boolean;
      };
    }>;
    coordinate?: { x: number; y: number };
  }
  const CustomTooltip = ({
    active,
    payload,
  }: CustomTooltipProps) => {
    // Prioritize chart hover over table hover
    // If actively hovering on chart with payload, use that
    if (active && payload && payload.length > 0) {
      // Check the first item in payload - Recharts puts the closest point first
      const firstPayload = payload[0]?.payload;

      if (!firstPayload) return null;

      // If the closest point is the actual point, don't show tooltip
      if (firstPayload.isActual) {
        return null;
      }

      // Otherwise, it's a guess - show guess tooltip
      // (even if actual point is also in payload due to overlap)
      const { name, displayDate, displayWeight, place } = firstPayload;
      return (
        <div
          style={{
            backgroundColor: "#fff",
            border: "1px solid #ccc",
            padding: 8,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          <div>
            <strong>{name}</strong>
            {place !== undefined && ` (Place #${place})`}
          </div>
          <div>Date: {formatDateForDisplay(displayDate)}</div>
          <div>Weight: {formatWeight(displayWeight)}</div>
        </div>
      );
    }

    // If hovering from table (not actively hovering on chart), show table hover tooltip
    if (hoveredGuessId && hoveredData) {
      const { name, displayDate, displayWeight, place } = hoveredData;
      return (
        <div
          style={{
            backgroundColor: "#fff",
            border: "1px solid #ccc",
            padding: 8,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          <div>
            <strong>{name}</strong>
            {place !== undefined && ` (Place #${place})`}
          </div>
          <div>Date: {formatDateForDisplay(displayDate)}</div>
          <div>Weight: {formatWeight(displayWeight)}</div>
        </div>
      );
    }

    return null;
  };

  // Custom shape for actual point - pink brand color
  // Made non-interactive with pointer-events: none to prevent hover tooltips
  const ActualShape: React.FC<{ cx: number; cy: number }> = (props) => (
    <circle
      r={10}
      fill="hsl(var(--primary))"
      stroke="hsl(var(--primary-foreground))"
      strokeWidth={0}
      cx={props.cx}
      cy={props.cy}
      style={{ pointerEvents: "none" }}
    />
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Calculate tooltip position when hoveredGuessId changes
  useEffect(() => {
    if (hoveredGuessId && hoveredData && containerRef.current) {
      // Approximate position based on data values
      // This is a simplified approach - for exact positioning, we'd need chart scale functions
      const container = containerRef.current;
      const chartWidth = container.offsetWidth - 60; // Account for margins
      const chartHeight = 420 - 60; // Account for margins

      // Get min/max values for scaling - calculate from guesses directly to avoid dependency issues
      const allGuessDates = guesses.map((g) => ymdToUtcNoon(g.guessed_birth_date).getTime());
      const allGuessWeights = guesses.map((g) => g.guessed_weight);
      const minDate = Math.min(...allGuessDates, actualDate);
      const maxDate = Math.max(...allGuessDates, actualDate);
      const minWeight = Math.min(...allGuessWeights, actual.actualWeight);
      const maxWeight = Math.max(...allGuessWeights, actual.actualWeight);

      const dateRange = maxDate - minDate || 1;
      const weightRange = maxWeight - minWeight || 1;

      // Calculate normalized position (0-1)
      const normalizedX = (hoveredData.x - minDate) / dateRange;
      const normalizedY = 1 - (hoveredData.y - minWeight) / weightRange; // Invert Y axis

      // Convert to pixel coordinates
      const x = 30 + normalizedX * chartWidth; // 30 is left margin
      const y = 20 + normalizedY * chartHeight; // 20 is top margin

      setTooltipPosition({ x, y });
    } else {
      setTooltipPosition(null);
    }
  }, [hoveredGuessId, hoveredData, guesses, actualDate, actual.actualWeight]);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", minWidth: 0 }}>
      <ResponsiveContainer width="100%" height={420}>
        <ScatterChart margin={{ top: 20, right: 30, left: 30, bottom: 40 }}>
          <XAxis
            style={{ fontSize: 11 }}
            type="number"
            dataKey="x"
            domain={["auto", "auto"]}
            tickFormatter={(tick) => new Date(tick).toLocaleDateString()}
          >
            <Label
              value="Birth Date"
              offset={-20}
              position="insideBottom"
              style={{ textAnchor: "middle" }}
            />
          </XAxis>
          <YAxis
            type="number"
            dataKey="y"
            domain={["auto", "auto"]}
            tickFormatter={(tick) => {
              const pounds = Math.floor(tick / 16);
              const ounces = Math.round(tick % 16);
              if (ounces === 0) {
                return `${pounds} lbs`;
              } else {
                return `${pounds} lbs ${ounces} oz`;
              }
            }}
            label={{
              value: "Birth Weight",
              angle: -90,
              position: "insideLeft",
              offset: -20,
              style: { textAnchor: "middle" },
            }}
            style={{ fontSize: 11 }}
          />
          {/* Render actual point and reference lines first (behind everything) */}
          <ReferenceLine
            x={actualPoint.x}
            stroke="hsl(var(--primary))"
            strokeDasharray="3 3"
          />
          <ReferenceLine
            y={actualPoint.y}
            stroke="hsl(var(--primary))"
            strokeDasharray="3 3"
          />
          <Scatter
            name="Actual"
            data={[actualPoint]}
            fill="hsl(var(--primary))"
            shape={(props: unknown) => (
              <ActualShape {...(props as { cx: number; cy: number })} />
            )}
          />
          {/* Render all guesses in a single Scatter component
            Sorted by place so higher places (lower numbers) render on top */}
          {allGuessesData.length > 0 && (
            <Scatter
              name="Guesses"
              data={allGuessesData}
              shape={(props: unknown) => (
                <CustomScatterShape {...(props as CustomScatterShapeProps)} />
              )}
            />
          )}
          <Tooltip content={<CustomTooltip />} isAnimationActive={false} />
        </ScatterChart>
      </ResponsiveContainer>
      {/* Custom tooltip for table hovers */}
      {hoveredGuessId && hoveredData && tooltipPosition && (
        <div
          style={{
            position: "absolute",
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: "translate(-50%, -100%)",
            marginTop: "-10px",
            pointerEvents: "none",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              border: "1px solid #ccc",
              padding: 8,
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          >
            <div>
              <strong>{hoveredData.name}</strong> (Place #{hoveredData.place})
            </div>
            <div>
              Date: {formatDateForDisplay(hoveredData.displayDate)}
            </div>
            <div>Weight: {formatWeight(hoveredData.displayWeight)}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuessScatterPlot;
