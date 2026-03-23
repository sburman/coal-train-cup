import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-brand border p-4 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "border-white/20 bg-brand-elevated/80 text-white",
        destructive:
          "border-destructive/50 bg-destructive/10 text-destructive",
        success:
          "border-primary/50 bg-primary-muted text-primary",
        warning:
          "border-amber-400/55 bg-amber-500/[0.18] text-amber-50 shadow-[0_0_0_1px_rgba(251,191,36,0.12)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = "Alert";

export { Alert, alertVariants };
