"use client";
import clsx from "clsx";
import { Mars, Venus, CircleHelp } from "lucide-react";

export type BabySexGuess = "boy" | "girl" | "unsure";

// Average US birth weights (CDC natality data), in pounds.
export const SEX_WEIGHT_PRESETS: Record<BabySexGuess, number> = {
  boy: 7 + 6 / 16, // 7 lbs 6 oz
  girl: 7 + 2 / 16, // 7 lbs 2 oz
  unsure: 7 + 4 / 16, // split the difference: 7 lbs 4 oz
};

const OPTIONS: {
  value: BabySexGuess;
  label: string;
  hint: string;
  Icon: typeof Mars;
}[] = [
  { value: "girl", label: "Girl", hint: "7 lb 2 oz", Icon: Venus },
  { value: "boy", label: "Boy", hint: "7 lb 6 oz", Icon: Mars },
  { value: "unsure", label: "Not sure", hint: "7 lb 4 oz", Icon: CircleHelp },
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
    <div
      className={clsx("flex flex-wrap items-center gap-1.5", className)}
      role="radiogroup"
      aria-label="Baby's sex (sets average weight)"
    >
      {OPTIONS.map(({ value: optValue, label, hint, Icon }) => {
        const selected = value === optValue;
        return (
          <button
            key={optValue}
            type="button"
            role="radio"
            aria-checked={selected}
            title={`${label} — pre-fills the US average of ${hint}`}
            onClick={() => onChange(optValue)}
            className={clsx(
              "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-colors",
              selected
                ? "border-[#FF8C7A] bg-[#FF8C7A]/10 text-foreground"
                : "border-input bg-background text-muted-foreground hover:border-[#FF8C7A]/60 hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="leading-none">{label}</span>
            <span
              className={clsx(
                "leading-none",
                selected ? "text-[#e07363]" : "text-muted-foreground/80"
              )}
            >
              {hint}
            </span>
          </button>
        );
      })}
    </div>
  );
}