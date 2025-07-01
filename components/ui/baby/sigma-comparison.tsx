"use client";

import { useMemo } from "react";
import { generateGaussianCurveData, getPriceForDateBet } from "@/lib/helpers";

interface SigmaComparisonProps {
  currentGuess: number;
  width?: number;
  height?: number;
}

export function SigmaComparison({
  currentGuess,
  width = 400,
  height = 200,
}: SigmaComparisonProps) {
  const curves = useMemo(() => {
    const sigmaValues = [
      {
        value: 3,
        color: "#ef4444",
        label: "σ=3 (Confident)",
        description: "Steep price differences",
      },
      {
        value: 5,
        color: "#3b82f6",
        label: "σ=5 (Normal)",
        description: "Moderate price differences",
      },
      {
        value: 8,
        color: "#10b981",
        label: "σ=8 (Uncertain)",
        description: "Gentle price differences",
      },
    ];

    return sigmaValues.map(({ value, color, label, description }) => {
      const data = generateGaussianCurveData(-14, 14, 100, 0, value);
      const probability = getPriceForDateBet(currentGuess, 0, value);

      // Create SVG path
      const xScale = (x: number) => ((x + 14) / 28) * width;
      const yScale = (y: number) => height - y * height * 0.7; // Leave more padding

      let path = `M ${xScale(data[0].x)} ${yScale(data[0].y)}`;
      for (let i = 1; i < data.length; i++) {
        path += ` L ${xScale(data[i].x)} ${yScale(data[i].y)}`;
      }

      return {
        path,
        color,
        label,
        description,
        probability,
        sigma: value,
      };
    });
  }, [currentGuess, width, height]);

  const userGuessX = ((currentGuess + 14) / 28) * width;

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-2">
        How Sigma (σ) Affects Betting Prices
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Smaller σ = steeper price changes. Larger σ = gentler price changes.
      </p>

      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="border border-gray-300 rounded bg-white mb-4"
      >
        {/* Grid */}
        <defs>
          <pattern
            id="comparisonGrid"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="#f0f0f0"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#comparisonGrid)" />

        {/* X-axis */}
        <line
          x1={0}
          y1={height - 20}
          x2={width}
          y2={height - 20}
          stroke="#666"
          strokeWidth="1"
        />

        {/* X-axis labels */}
        <text x={0} y={height - 5} fontSize="10" fill="#666" textAnchor="start">
          -14
        </text>
        <text
          x={width / 2}
          y={height - 5}
          fontSize="10"
          fill="#666"
          textAnchor="middle"
        >
          0
        </text>
        <text
          x={width}
          y={height - 5}
          fontSize="10"
          fill="#666"
          textAnchor="end"
        >
          +14
        </text>

        {/* Draw all curves */}
        {curves.map((curve, index) => (
          <g key={index}>
            {/* Curve line */}
            <path
              d={curve.path}
              fill="none"
              stroke={curve.color}
              strokeWidth="2"
              strokeDasharray={index === 1 ? "none" : "5,3"}
            />

            {/* Fill under curve */}
            <path
              d={`${curve.path} L ${width} ${height - 20} L 0 ${height - 20} Z`}
              fill={curve.color}
              fillOpacity="0.05"
            />
          </g>
        ))}

        {/* User's guess line */}
        <line
          x1={userGuessX}
          y1={20}
          x2={userGuessX}
          y2={height - 20}
          stroke="#000"
          strokeWidth="2"
          strokeDasharray="8,4"
        />

        {/* User's guess dots on each curve */}
        {curves.map((curve, index) => {
          const guessY = height - curve.probability * height * 0.7;
          return (
            <circle
              key={index}
              cx={userGuessX}
              cy={guessY}
              r="4"
              fill={curve.color}
              stroke="white"
              strokeWidth="2"
            />
          );
        })}

        {/* User label */}
        <text
          x={userGuessX}
          y={15}
          fontSize="12"
          fill="#000"
          textAnchor="middle"
          fontWeight="600"
        >
          Your Guess ({currentGuess}d)
        </text>
      </svg>

      {/* Legend and probabilities */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {curves.map((curve, index) => (
          <div key={index} className="text-center p-3 border rounded">
            <div className="flex items-center justify-center mb-2">
              <div
                className="w-4 h-4 rounded mr-2"
                style={{ backgroundColor: curve.color }}
              ></div>
              <span className="font-medium text-sm">{curve.label}</span>
            </div>
            <div className="text-xs text-gray-600 mb-2">
              {curve.description}
            </div>
            <div className="text-sm">
              <strong>{(curve.probability * 100).toFixed(1)}%</strong> of peak
            </div>
            <div className="text-xs text-gray-500 mt-1">
              If min=$5, max=$25:
              <br />
              <strong>${(5 + (25 - 5) * curve.probability).toFixed(2)}</strong>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded text-sm">
        <strong>Key Insight:</strong> With σ=3 (confident), being off by{" "}
        {Math.abs(currentGuess)} days costs much more than with σ=8 (uncertain).
        Choose sigma based on how confident you are about the due date
        prediction accuracy.
      </div>
    </div>
  );
}
