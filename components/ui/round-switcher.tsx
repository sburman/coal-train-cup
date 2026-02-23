"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function RoundSwitcher({
  rounds,
  value,
  onValueChange,
  label = "Show leaderboard after:",
  roundLabel = (r) => (r === 1 ? "Round 1" : String(r)),
  className,
}: {
  rounds: number[];
  value: number | null;
  onValueChange: (round: number) => void;
  label?: string;
  roundLabel?: (round: number) => string;
  className?: string;
}) {
  if (rounds.length === 0) return null;
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <p className="text-sm font-medium text-white/90">{label}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {rounds.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => onValueChange(r)}
            className={cn(
              "min-h-[44px] min-w-[44px] rounded-brand px-3 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface sm:min-h-0 sm:min-w-0 sm:py-1.5",
              value === r
                ? "bg-primary text-primary-foreground"
                : "bg-brand-elevated text-white hover:bg-white/10"
            )}
          >
            {roundLabel(r)}
          </button>
        ))}
      </div>
    </div>
  );
}
