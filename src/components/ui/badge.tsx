
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-primary/20 bg-primary/10 text-primary",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-destructive/20 bg-destructive/10 text-destructive",
        outline: "text-foreground border-border",
        success:
          "border-success/20 bg-success/10 text-success",
        warning:
          "border-warning/20 bg-warning/10 text-warning",
        info:
          "border-info/20 bg-info/10 text-info",
        gradient:
          "border-transparent bg-gradient-to-r from-primary to-primary/80 text-primary-foreground",
      },
      size: {
        default: "px-2.5 py-0.5 text-[11px]",
        sm: "px-2 py-0.5 text-[11px]",
        lg: "px-3.5 py-1 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
