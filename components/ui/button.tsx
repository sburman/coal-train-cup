"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-brand text-sm font-medium transition-colors focus-visible:outline focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary-hover active:opacity-90",
        destructive: "bg-destructive text-white hover:opacity-90",
        outline:
          "border border-white/30 bg-transparent hover:bg-white/10 hover:border-white/40",
        secondary: "bg-brand-elevated text-white hover:bg-white/10",
        ghost: "hover:bg-white/10",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 min-h-[44px] px-3 text-xs sm:min-h-0",
        default: "h-11 min-h-[44px] px-4 py-2 sm:min-h-0",
        lg: "h-12 min-h-[44px] px-6 text-base sm:min-h-0",
        icon: "h-11 min-h-[44px] w-11 min-w-[44px] sm:min-h-0 sm:min-w-0",
        "icon-sm": "h-9 min-h-[44px] min-w-[44px] w-9 sm:min-h-0 sm:min-w-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
