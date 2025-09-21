"use client";

import { useMemo } from "react";
import { getGuessComponentPrice } from "@/lib/helpers/pricing";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Info } from "lucide-react";

interface GaussianCurveProps {
  currentGuess: number;
  mean: number;
  min: number;
  max: number;
  minPrice: number;
  maxPrice: number;
  // If provided, use this price for the user's guess instead of recomputing.
  computedPrice?: number;
  sigma?: number;
  width?: number;
  height?: number;
  className?: string;
  title: string;
  tooltipText?: string;
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
  // optional externally-computed price for the user's current guess
  computedPrice,
  sigma,
  width = 300,
  height = 140,
  className = "",
  title,
  tooltipText,
  minLabel,
  meanLabel,
  maxLabel,
  showGrid = false,
}: GaussianCurveProps) {
  const yAxisLabelWidth = 40; // Space for Y-axis labels

  // Defensive: ensure min < max and minPrice < maxPrice to avoid NaN in scales
  const safeMin = Number.isFinite(min) ? min : 0;
  let safeMax = Number.isFinite(max) ? max : safeMin + 1;
  if (safeMax <= safeMin) safeMax = safeMin + 1;

  const safeMinPrice = Number.isFinite(minPrice) ? minPrice : 0;
  let safeMaxPrice = Number.isFinite(maxPrice) ? maxPrice : safeMinPrice + 1;
  if (safeMaxPrice <= safeMinPrice) safeMaxPrice = safeMinPrice + 1;

  const bound = Math.max(Math.abs(safeMin - mean), Math.abs(safeMax - mean));

  const curveData = useMemo(() => {
    const points: { x: number; y: number }[] = [];
    const steps = 100;
    for (let i = 0; i <= steps; i++) {
      const x = safeMin + (i / steps) * (safeMax - safeMin);
      const y = getGuessComponentPrice({
        guess: x,
        mean,
        bound,
        minPrice: safeMinPrice,
        maxPrice: safeMaxPrice,
        ...(sigma !== undefined ? { sigma } : {}),
      });
      points.push({ x, y });
    }
    return points;
  }, [safeMin, safeMax, mean, safeMinPrice, safeMaxPrice, sigma, bound]);

  const userPrice =
    computedPrice ??
    getGuessComponentPrice({
      guess: currentGuess,
      mean,
      bound,
      minPrice: safeMinPrice,
      maxPrice: safeMaxPrice,
      ...(sigma !== undefined ? { sigma } : {}),
    });

  // Centralize the bottom offset for all elements that align to the graph base
  const graphBottomOffset = 16; // 10 (original) + 6 (extra nudge)

  const curvePath = useMemo(() => {
    if (curveData.length === 0) return "";

    const denomX = safeMax - safeMin || 1;
    const denomY = safeMaxPrice - safeMinPrice || 1;

    const xScale = (x: number) => ((x - safeMin) / denomX) * width;
    // Use the shared graphBottomOffset
    const yScale = (y: number) =>
      height - ((y - safeMinPrice) / denomY) * height * 0.8 - graphBottomOffset;

    let path = `M ${xScale(curveData[0].x)} ${yScale(curveData[0].y)}`;

    for (let i = 1; i < curveData.length; i++) {
      const point = curveData[i];
      path += ` L ${xScale(point.x)} ${yScale(point.y)}`;
    }

    return path;
  }, [
    curveData,
    safeMin,
    safeMax,
    width,
    height,
    safeMinPrice,
    safeMaxPrice,
    graphBottomOffset,
  ]);
  const denomX = safeMax - safeMin || 1;
  const denomY = safeMaxPrice - safeMinPrice || 1;
  const userGuessX = Number.isFinite(currentGuess)
    ? ((currentGuess - safeMin) / denomX) * width
    : 0;
  // Use the shared graphBottomOffset
  const userGuessY = Number.isFinite(userPrice)
    ? height -
      ((userPrice - safeMinPrice) / denomY) * height * 0.8 -
      graphBottomOffset
    : height - graphBottomOffset;

  return (
    <div className={`flex flex-col font-mono w-full ${className}`}>
      <div className="flex items-center gap-2 mb-2 text-sm font-bold tracking-widest uppercase">
        {title}
        {tooltipText && (
          <Popover>
            <PopoverTrigger>
              <Info className="h-4 w-4 text-muted-foreground" />
            </PopoverTrigger>
            <PopoverContent>
              <p className="text-xs">{tooltipText}</p>
            </PopoverContent>
          </Popover>
        )}
      </div>
      <div className="w-full max-w-full overflow-hidden">
        <svg
          width={width + yAxisLabelWidth}
          height={height}
          viewBox={`0 0 ${width + yAxisLabelWidth} ${height}`}
          className="w-full h-auto max-w-full min-w-0"
          preserveAspectRatio="xMidYMid meet"
          style={{ maxWidth: "100%" }}
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
            ${safeMinPrice.toFixed(2)}
          </text>
          <text
            x={yAxisLabelWidth - 4}
            y={15}
            fontSize="10"
            fill="hsl(var(--muted-foreground))"
            textAnchor="end"
            fontFamily="JetBrains Mono, monospace"
          >
            ${safeMaxPrice.toFixed(2)}
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
              {minLabel ?? safeMin}
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
              {maxLabel ?? safeMax}
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
                r="4"
                fill="hsl(var(--primary))"
                stroke="hsl(var(--foreground))"
                strokeWidth="0"
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
      </div>

      {/* Probability display */}
      <div className="mt-4 text-center text-muted-foreground text-xs">
        <div>
          Individual guess price:{" "}
          <span className="font-semibold text-primary">
            ${userPrice.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
