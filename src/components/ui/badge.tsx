import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-ring/30 focus:ring-offset-1",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/85",
        secondary:
          "border-border bg-secondary text-secondary-foreground hover:bg-accent",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/85",
        outline: "border-border text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
