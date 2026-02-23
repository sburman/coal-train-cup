import * as React from "react";
import { cn } from "@/lib/utils";

export function SectionHeader({
  className,
  as: Comp = "h2",
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & { as?: "h1" | "h2" | "h3" }) {
  return (
    <Comp
      className={cn(
        "font-display font-semibold tracking-tight text-white",
        Comp === "h1" && "text-2xl md:text-3xl mb-2",
        Comp === "h2" && "text-xl md:text-2xl mb-2",
        Comp === "h3" && "text-lg md:text-xl mb-1",
        className
      )}
      {...props}
    />
  );
}
