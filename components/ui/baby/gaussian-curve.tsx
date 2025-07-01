"use client";

import { useMemo } from "react";
import { generateGaussianCurveData, getPriceForDateBet } from "@/lib/helpers";

interface GaussianCurveProps {
  currentGuess: number;
  min?: number;
  max?: number;
  sigma?: number;
  width?: number;
  height?: number;
  className?: string;
}

export function GaussianCurve({
  currentGuess,
  min = -14,
  max = 14,
  sigma = 5,
  width = 300,
  height = 120,
  className = "",
}: GaussianCurveProps) {
  const mu = (min + max) / 2; // Center the curve
  // Generate curve data points
  const curveData = useMemo(() => {
    return generateGaussianCurveData(min, max, 100, mu, sigma);
  }, [min, max, mu, sigma]);

  // Calculate user's guess position and probability
  const userProbability = useMemo(() => {
    return getPriceForDateBet(currentGuess, mu, sigma);
  }, [currentGuess, mu, sigma]);

  // Create SVG path for the curve
  const curvePath = useMemo(() => {
    if (curveData.length === 0) return "";

    const xScale = (x: number) => ((x - min) / (max - min)) * width;
    const yScale = (y: number) => height - y * height * 0.8; // Leave 20% padding

    let path = `M ${xScale(curveData[0].x)} ${yScale(curveData[0].y)}`;

    for (let i = 1; i < curveData.length; i++) {
      const point = curveData[i];
      path += ` L ${xScale(point.x)} ${yScale(point.y)}`;
    }

    return path;
  }, [curveData, min, max, width, height]);

  // Calculate user guess position
  const userGuessX = ((currentGuess - min) / (max - min)) * width;
  const userGuessY = height - userProbability * height * 0.8;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="mb-2 text-sm text-gray-600">
        Birth Date Probability Distribution
      </div>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="border border-gray-200 rounded-lg bg-gray-50"
      >
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
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* X-axis */}
        <line
          x1={0}
          y1={height - 10}
          x2={width}
          y2={height - 10}
          stroke="#666"
          strokeWidth="1"
        />

        {/* X-axis labels */}
        <text x={0} y={height - 2} fontSize="10" fill="#666" textAnchor="start">
          {min}
        </text>
        <text
          x={width / 2}
          y={height - 2}
          fontSize="10"
          fill="#666"
          textAnchor="middle"
        >
          0
        </text>
        <text
          x={width}
          y={height - 2}
          fontSize="10"
          fill="#666"
          textAnchor="end"
        >
          {max}
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
          d={`${curvePath} L ${width} ${height - 10} L 0 ${height - 10} Z`}
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

        {/* Peak indicator
        <g>
          <circle
            cx={width / 2}
            cy={height - 1 * height * 0.8}
            r="3"
            fill="#10b981"
            stroke="white"
            strokeWidth="1"
          />
          <text
            x={width / 2}
            y={height - 1 * height * 0.8 - 6}
            fontSize="9"
            fill="#10b981"
            textAnchor="middle"
            fontWeight="600"
          >
            Peak
          </text>
        </g> */}
      </svg>

      {/* Probability display */}
      <div className="mt-2 text-xs text-center text-gray-600">
        <div>
          Your guess probability:{" "}
          <span className="font-semibold text-red-600">
            {(userProbability * 100).toFixed(1)}%
          </span>{" "}
          of peak
        </div>
        <div className="text-xs mt-1">Peak at due date (day 0) = 100%</div>
      </div>
    </div>
  );
}
