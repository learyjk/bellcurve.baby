"use client";

import { useMemo } from "react";
import { getBetComponentPrice } from "@/lib/helpers/pricing";

interface GaussianCurveProps {
  currentGuess: number;
  mean: number;
  min: number;
  max: number;
  minPrice: number;
  maxPrice: number;
  width?: number;
  height?: number;
  className?: string;
  title: string;
  minLabel?: string;
  meanLabel?: string;
  maxLabel?: string;
}

export function GaussianCurve({
  currentGuess,
  mean,
  min,
  max,
  minPrice,
  maxPrice,
  width = 300,
  height = 120,
  className = "",
  title,
  minLabel,
  meanLabel,
  maxLabel,
}: GaussianCurveProps) {
  const yAxisLabelWidth = 40; // Space for Y-axis labels

  const curveData = useMemo(() => {
    const points = [];
    const steps = 100;
    for (let i = 0; i <= steps; i++) {
      const x = min + (i / steps) * (max - min);
      const y = getBetComponentPrice({
        guess: x,
        mean,
        bound: Math.max(Math.abs(min - mean), Math.abs(max - mean)),
        minPrice,
        maxPrice,
      });
      points.push({ x, y });
    }
    return points;
  }, [min, max, mean, minPrice, maxPrice]);

  const userPrice = getBetComponentPrice({
    guess: currentGuess,
    mean,
    bound: Math.max(Math.abs(min - mean), Math.abs(max - mean)),
    minPrice,
    maxPrice,
  });

  const curvePath = useMemo(() => {
    if (curveData.length === 0) return "";

    const xScale = (x: number) => ((x - min) / (max - min)) * width;
    const yScale = (y: number) =>
      height - ((y - minPrice) / (maxPrice - minPrice)) * height * 0.8 - 10;

    let path = `M ${xScale(curveData[0].x)} ${yScale(curveData[0].y)}`;

    for (let i = 1; i < curveData.length; i++) {
      const point = curveData[i];
      path += ` L ${xScale(point.x)} ${yScale(point.y)}`;
    }

    return path;
  }, [curveData, min, max, width, height, minPrice, maxPrice]);

  const userGuessX = ((currentGuess - min) / (max - min)) * width;
  const userGuessY =
    height -
    ((userPrice - minPrice) / (maxPrice - minPrice)) * height * 0.8 -
    10;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="mb-2 text-sm text-gray-600">{title}</div>
      <svg
        width={width + yAxisLabelWidth}
        height={height}
        viewBox={`0 0 ${width + yAxisLabelWidth} ${height}`}
        className="border border-gray-200 rounded-lg bg-gray-50 overflow-visible"
      >
        {/* Y-axis labels */}
        <text
          x={yAxisLabelWidth - 4}
          y={height - 10}
          fontSize="10"
          fill="#666"
          textAnchor="end"
        >
          ${minPrice.toFixed(2)}
        </text>
        <text
          x={yAxisLabelWidth - 4}
          y={15}
          fontSize="10"
          fill="#666"
          textAnchor="end"
        >
          ${maxPrice.toFixed(2)}
        </text>

        <g transform={`translate(${yAxisLabelWidth}, 0)`}>
          {/* Grid lines */}
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
                stroke="#e5e5e5"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width={width} height="100%" fill="url(#grid)" />

          {/* X-axis labels */}
          <text x={0} y={height} fontSize="10" fill="#666" textAnchor="start">
            {minLabel ?? min}
          </text>
          <text
            x={width / 2}
            y={height}
            fontSize="10"
            fill="#666"
            textAnchor="middle"
          >
            {meanLabel ?? mean}
          </text>
          <text x={width} y={height} fontSize="10" fill="#666" textAnchor="end">
            {maxLabel ?? max}
          </text>

          {/* Gaussian curve */}
          <path
            d={curvePath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            className="drop-shadow-sm"
          />

          {/* Fill area under curve */}
          <path
            d={`${curvePath} L ${userGuessX} ${height - 10} L ${userGuessX} ${
              height - 10
            } Z`}
            fill="#3b82f6"
            fillOpacity="0.1"
          />

          {/* User's guess indicator */}
          <g>
            {/* Vertical line at user's guess */}
            <line
              x1={userGuessX}
              y1={userGuessY}
              x2={userGuessX}
              y2={height - 10}
              stroke="#ef4444"
              strokeWidth="2"
              strokeDasharray="4,2"
            />

            {/* Dot at user's guess position on curve */}
            <circle
              cx={userGuessX}
              cy={userGuessY}
              r="4"
              fill="#ef4444"
              stroke="white"
              strokeWidth="2"
              className="drop-shadow-sm"
            />

            {/* Label for user's guess */}
            <text
              x={userGuessX}
              y={userGuessY - 8}
              fontSize="10"
              fill="#ef4444"
              textAnchor="middle"
              fontWeight="600"
            >
              You
            </text>
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
        <div className="text-xs mt-1">
          Peak at {mean} days = ${maxPrice.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
