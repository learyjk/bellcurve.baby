"use client";

import { useState } from "react";
import { PRICING_STYLES, PricingStyle } from "@/lib/helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { GaussianCurve } from "@/components/ui/baby/gaussian-curve";

interface PricingStyleSelectorProps {
  selectedStyle: PricingStyle;
  onStyleChange: (style: PricingStyle) => void;
  minPrice: number;
  maxPrice: number;
}

export function PricingStyleSelector({
  selectedStyle,
  onStyleChange,
  minPrice,
  maxPrice,
}: PricingStyleSelectorProps) {
  const [previewGuess, setPreviewGuess] = useState(0);

  const calculatePreviewPrice = (dayOffset: number, sigma: number) => {
    const probability = Math.exp(-(dayOffset ** 2) / (2 * sigma ** 2));
    return minPrice + (maxPrice - minPrice) * probability;
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-semibold">Pricing Style</Label>
        <p className="text-sm text-gray-600 mt-2">
          Choose how steep the price differences should be between the due date
          and other days.
        </p>
      </div>

      {/* Style Selection Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Object.entries(PRICING_STYLES).map(([key, style]) => {
          const isSelected = selectedStyle === key;
          const previewPrice = calculatePreviewPrice(7, style.sigma);

          return (
            <Card
              key={key}
              className={`cursor-pointer transition-all min-h-[400px] ${
                isSelected
                  ? "ring-2 ring-blue-500 bg-blue-50"
                  : "hover:shadow-md"
              }`}
              onClick={() => onStyleChange(key as PricingStyle)}
            >
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-3">
                  <input
                    type="radio"
                    name="pricingStyle"
                    value={key}
                    checked={isSelected}
                    onChange={() => onStyleChange(key as PricingStyle)}
                    className="w-4 h-4"
                  />
                  {style.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <p className="text-sm text-gray-600">{style.description}</p>

                {/* Preview pricing */}
                <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-2">
                  <div className="font-medium text-gray-700">
                    Price Examples:
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Due date (0d):</span>
                      <strong>${maxPrice}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>±7 days:</span>
                      <strong>${previewPrice.toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>±14 days:</span>
                      <strong>${minPrice}</strong>
                    </div>
                  </div>
                </div>

                {/* Small curve preview */}
                <div className="flex justify-center pt-2">
                  <GaussianCurve
                    currentGuess={0}
                    min={-14}
                    max={14}
                    sigma={style.sigma}
                    width={220}
                    height={80}
                    className="text-xs"
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Interactive Preview */}
      {selectedStyle && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-xl">
              Interactive Preview - {PRICING_STYLES[selectedStyle].name} Style
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <GaussianCurve
                currentGuess={previewGuess}
                min={-14}
                max={14}
                sigma={PRICING_STYLES[selectedStyle].sigma}
                width={500}
                height={180}
              />
            </div>

            {/* Interactive slider */}
            <div className="space-y-4">
              <Label htmlFor="preview-slider" className="text-base font-medium">
                Try different guess positions:
              </Label>
              <div className="px-4">
                <input
                  id="preview-slider"
                  type="range"
                  min={-14}
                  max={14}
                  step={1}
                  value={previewGuess}
                  onChange={(e) => setPreviewGuess(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-2">
                  <span>-14 days</span>
                  <span>Due Date</span>
                  <span>+14 days</span>
                </div>
              </div>
            </div>

            {/* Current price display */}
            <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl text-center border border-blue-200">
              <div className="text-lg font-semibold text-gray-700 mb-2">
                At {previewGuess} days from due date:
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                $
                {calculatePreviewPrice(
                  previewGuess,
                  PRICING_STYLES[selectedStyle].sigma
                ).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">
                {(
                  (calculatePreviewPrice(
                    previewGuess,
                    PRICING_STYLES[selectedStyle].sigma
                  ) /
                    maxPrice) *
                  100
                ).toFixed(1)}
                % of max price
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden inputs for form submission */}
      <input
        type="hidden"
        name="sigma_days"
        value={PRICING_STYLES[selectedStyle].sigma}
      />
    </div>
  );
}
