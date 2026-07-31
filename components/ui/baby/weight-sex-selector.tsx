"use client";
import clsx from "clsx";

export type BabySexGuess = "boy" | "girl" | "unsure";

// Average US birth weights (CDC natality data), in pounds.
export const SEX_WEIGHT_PRESETS: Record<BabySexGuess, number> = {
  boy: 7 + 6 / 16, // 7 lbs 6 oz
  girl: 7 + 2 / 16, // 7 lbs 2 oz
  unsure: 7 + 4 / 16, // split the difference: 7 lbs 4 oz
};

const OPTIONS: { value: BabySexGuess; label: string; hint: string }[] = [
  { value: "boy", label: "Boy", hint: "7 lb 6 oz" },
  { value: "girl", label: "Girl", hint: "7 lb 2 oz" },
  { value: "unsure", label: "Not sure", hint: "7 lb 4 oz" },
];

export function WeightSexSelector({
  value,
  onChange,
  className,
}: {
  value: BabySexGuess | null;
  onChange: (sex: BabySexGuess) => void;
  className?: string;
}) {
  return (
    <div className={clsx("flex gap-2", className)} role="radiogroup" aria-label="Baby's sex (sets average weight)">
      {OPTIONS.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.value)}
            className={clsx(
              "flex-1 rounded-full border px-3 py-2 text-sm font-medium transition-colors",
              selected
                ? "border-[#FF8C7A] bg-[#FF8C7A]/10 text-foreground"
                : "border-input bg-background text-muted-foreground hover:border-[#FF8C7A]/60 hover:text-foreground"
            )}
          >
            <span className="block leading-tight">{opt.label}</span>
            <span
              className={clsx(
                "block text-xs leading-tight",
                selected ? "text-[#e07363]" : "text-muted-foreground"
              )}
            >
              {opt.hint}
            </span>
          </button>
        );
      })}
    </div>
  );
}