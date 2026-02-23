import * as React from "react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-brand border border-white/10 bg-brand-elevated/60 px-4 py-3",
        className
      )}
      {...props}
    >
      <p className="text-sm text-white/80">{label}</p>
      <p className="mt-0.5 font-display text-lg font-semibold text-primary">
        {value}
      </p>
    </div>
  );
}
