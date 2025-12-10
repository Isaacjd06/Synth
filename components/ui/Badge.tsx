import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all duration-300 animate-fade-in-up",
  {
    variants: {
      variant: {
        default: "border-primary/40 bg-primary/15 text-primary shadow-[0_0_12px_hsl(217_100%_60%/0.2)]",
        secondary: "border-border/60 bg-secondary/60 text-secondary-foreground",
        destructive: "border-destructive/40 bg-destructive/15 text-destructive shadow-[0_0_12px_hsl(0_70%_50%/0.2)]",
        outline: "text-foreground border-border/60",
        success: "border-[hsl(142_70%_45%/0.4)] bg-[hsl(142_70%_45%/0.15)] text-[hsl(142_70%_60%)] shadow-[0_0_12px_hsl(142_80%_35%/0.25)]",
        error: "border-[hsl(0_65%_50%/0.4)] bg-[hsl(0_65%_50%/0.15)] text-[hsl(0_70%_65%)] shadow-[0_0_12px_hsl(0_70%_40%/0.25)]",
        running: "border-[hsl(45_90%_50%/0.4)] bg-[hsl(45_90%_50%/0.15)] text-[hsl(45_90%_60%)] animate-pulse shadow-[0_0_12px_hsl(45_85%_40%/0.25)]",
        inactive: "border-border/40 bg-muted/40 text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };


