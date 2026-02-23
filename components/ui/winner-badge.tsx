import * as React from "react";
import { cn } from "@/lib/utils";

export function WinnerBadge({
  title,
  winner,
  icon,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  title: string;
  winner: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-brand-lg border border-primary/30 bg-brand-elevated/80 px-5 py-4 shadow-card",
        "ring-1 ring-primary/10",
        className
      )}
      {...props}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-primary/90">
        {title}
      </p>
      <div className="mt-2 flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary [&>svg]:size-6">
          {icon}
        </span>
        <p className="font-display text-xl font-semibold text-white md:text-2xl">
          {winner}
        </p>
      </div>
    </div>
  );
}
