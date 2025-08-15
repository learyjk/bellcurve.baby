"use client";

import { useMemo } from "react";
import { getGuessComponentPrice } from "@/lib/helpers/pricing";

interface GaussianCurveProps {
  currentGuess: number;
  mean: number;
  min: number;
  max: number;
  minPrice: number;
  maxPrice: number;
  sigma?: number;
  width?: number;
  height?: number;
  className?: string;
  title: string;
  minLabel?: string;
  meanLabel?: string;
  maxLabel?: string;
  showGrid?: boolean;
}

export function GaussianCurve({
  currentGuess,
  mean,
  min,
  max,
  minPrice,
  maxPrice,
  sigma,
  width = 300,
  height = 140,
  className = "",
  title,
  minLabel,
  meanLabel,
  maxLabel,
  showGrid = false,
}: GaussianCurveProps) {
  const yAxisLabelWidth = 40; // Space for Y-axis labels

  const curveData = useMemo(() => {
    const points = [];
    const steps = 100;
    for (let i = 0; i <= steps; i++) {
      const x = min + (i / steps) * (max - min);
      const y = getGuessComponentPrice({
        guess: x,
        mean,
        bound: Math.max(Math.abs(min - mean), Math.abs(max - mean)),
        minPrice,
        maxPrice,
        ...(sigma !== undefined ? { sigma } : {}),
      });
      points.push({ x, y });
    }
    return points;
  }, [min, max, mean, minPrice, maxPrice, sigma]);

  const userPrice = getGuessComponentPrice({
    guess: currentGuess,
    mean,
    bound: Math.max(Math.abs(min - mean), Math.abs(max - mean)),
    minPrice,
    maxPrice,
    ...(sigma !== undefined ? { sigma } : {}),
  });

  // Centralize the bottom offset for all elements that align to the graph base
  const graphBottomOffset = 16; // 10 (original) + 6 (extra nudge)

  const curvePath = useMemo(() => {
    if (curveData.length === 0) return "";

    const xScale = (x: number) => ((x - min) / (max - min)) * width;
    // Use the shared graphBottomOffset
    const yScale = (y: number) =>
      height -
      ((y - minPrice) / (maxPrice - minPrice)) * height * 0.8 -
      graphBottomOffset;

    let path = `M ${xScale(curveData[0].x)} ${yScale(curveData[0].y)}`;

    for (let i = 1; i < curveData.length; i++) {
      const point = curveData[i];
      path += ` L ${xScale(point.x)} ${yScale(point.y)}`;
    }

    return path;
  }, [
    curveData,
    min,
    max,
    width,
    height,
    minPrice,
    maxPrice,
    graphBottomOffset,
  ]);

  const userGuessX = ((currentGuess - min) / (max - min)) * width;
  // Use the shared graphBottomOffset
  const userGuessY =
    height -
    ((userPrice - minPrice) / (maxPrice - minPrice)) * height * 0.8 -
    graphBottomOffset;

  return (
    <div className={`flex flex-col font-mono ${className}`}>
      <div className="mb-2 text-sm font-bold tracking-widest uppercase">
        {title}
      </div>
      <svg
        width={width + yAxisLabelWidth}
        height={height}
        viewBox={`0 0 ${width + yAxisLabelWidth} ${height}`}
        className="overflow-visible"
      >
        {/* Y-axis labels */}
        <text
          x={yAxisLabelWidth - 4}
          y={height - graphBottomOffset}
          fontSize="10"
          fill="hsl(var(--muted-foreground))"
          textAnchor="end"
          fontFamily="JetBrains Mono, monospace"
        >
          ${minPrice.toFixed(2)}
        </text>
        <text
          x={yAxisLabelWidth - 4}
          y={15}
          fontSize="10"
          fill="hsl(var(--muted-foreground))"
          textAnchor="end"
          fontFamily="JetBrains Mono, monospace"
        >
          ${maxPrice.toFixed(2)}
        </text>

        <g transform={`translate(${yAxisLabelWidth}, 0)`}>
          {/* Grid lines (optional) */}
          {showGrid && (
            <>
              <defs>
                <pattern
                  id="grid"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 20 0 L 0 0 0 20"
                    fill="none"
                    stroke="hsl(var(--border))"
                    strokeWidth="0.5"
                  />
                </pattern>
              </defs>
              <rect width={width} height="100%" fill="url(#grid)" />
            </>
          )}

          {/* X-axis labels */}
          <text
            x={0}
            y={height - 4}
            fontSize="10"
            fill="hsl(var(--muted-foreground))"
            textAnchor="start"
            fontFamily="JetBrains Mono, monospace"
          >
            {minLabel ?? min}
          </text>
          <text
            x={width / 2}
            y={height - 4}
            fontSize="10"
            fill="hsl(var(--muted-foreground))"
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
          >
            {meanLabel ?? mean}
          </text>
          <text
            x={width}
            y={height - 4}
            fontSize="10"
            fill="hsl(var(--muted-foreground))"
            textAnchor="end"
            fontFamily="JetBrains Mono, monospace"
          >
            {maxLabel ?? max}
          </text>

          {/* Gaussian curve */}
          <path
            d={curvePath}
            fill="none"
            stroke="hsl(var(--foreground))"
            strokeWidth="2"
            className="drop-shadow-sm"
          />

          {/* Fill area under curve */}
          <path
            d={`${curvePath} L ${userGuessX} ${
              height - graphBottomOffset
            } L ${userGuessX} ${height - graphBottomOffset} Z`}
            fill="none"
            fillOpacity="0.1"
          />

          {/* User's guess indicator */}
          <g>
            {/* Vertical line at user's guess */}
            {/* <line
              x1={userGuessX}
              y1={userGuessY}
              x2={userGuessX}
              y2={height - graphBottomOffset}
              stroke="#ef4444"
              strokeWidth="2"
              strokeDasharray="4,2"
            /> */}

            {/* Dot at user's guess position on curve */}
            <circle
              cx={userGuessX}
              cy={userGuessY}
              r="6"
              fill="hsl(var(--primary))"
              stroke="hsl(var(--foreground))"
              strokeWidth="2"
              className="drop-shadow-sm"
            />

            {/* Label for user's guess */}
            {/* <text
              x={userGuessX}
              y={userGuessY - 8}
              fontSize="10"
              fill="#ef4444"
              textAnchor="middle"
              fontWeight="600"
            >
              You
            </text> */}
          </g>
        </g>
      </svg>

      {/* Probability display */}
      <div className="mt-2 text-xs text-center text-gray-600">
        <div>
          Individual guess price:{" "}
          <span className="font-semibold text-red-600">
            ${userPrice.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
