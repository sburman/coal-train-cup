import * as React from "react";
import { cn } from "@/lib/utils";

export function ChartContainer({
  title,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  title?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-brand-lg border border-white/10 bg-brand-elevated/60 p-4 md:p-5",
        className
      )}
      {...props}
    >
      {title && (
        <h3 className="mb-3 font-display text-sm font-semibold text-white/90">
          {title}
        </h3>
      )}
      <div className="min-h-[200px] w-full">{children}</div>
    </div>
  );
}
