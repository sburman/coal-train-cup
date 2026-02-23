import * as React from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-brand-lg border border-dashed border-white/20 bg-brand-elevated/40 py-12 px-4 text-center",
        className
      )}
      {...props}
    >
      <p className="font-display text-lg font-medium text-white/90">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-white/70">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
