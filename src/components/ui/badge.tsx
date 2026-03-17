
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary/10 text-primary hover:bg-primary/20 shadow-sm",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm",
        destructive:
          "border-transparent bg-destructive/10 text-destructive hover:bg-destructive/20 shadow-sm",
        outline: "text-foreground border-border hover:bg-accent shadow-sm",
        success:
          "border-transparent bg-success/10 text-success hover:bg-success/20 shadow-sm",
        warning:
          "border-transparent bg-warning/10 text-warning hover:bg-warning/20 shadow-sm",
        info:
          "border-transparent bg-info/10 text-info hover:bg-info/20 shadow-sm",
        gradient:
          "border-transparent bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md hover:shadow-lg",
      },
      size: {
        default: "px-3 py-1 text-xs",
        sm: "px-2 py-0.5 text-xs",
        lg: "px-4 py-1.5 text-sm",
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
