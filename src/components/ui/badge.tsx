import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary/12 text-primary hover:bg-primary/18",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive/12 text-destructive hover:bg-destructive/18",
        outline:
          "text-foreground border-border hover:bg-accent",
        success:
          "border-transparent bg-success/12 text-success hover:bg-success/18",
        warning:
          "border-transparent bg-warning/12 text-warning hover:bg-warning/18",
        info:
          "border-transparent bg-info/12 text-info hover:bg-info/18",
        gradient:
          "border-transparent bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(199_89%_52%))] text-primary-foreground shadow-sm shadow-primary/25",
        solidPrimary:
          "border-transparent bg-primary text-primary-foreground",
        solidSuccess:
          "border-transparent bg-success text-success-foreground",
        solidWarning:
          "border-transparent bg-warning text-warning-foreground",
        solidDestructive:
          "border-transparent bg-destructive text-destructive-foreground",
      },
      size: {
        default: "px-2 py-0.5 text-xs",
        sm: "px-1.5 py-0 text-[11px]",
        lg: "px-2.5 py-1 text-xs",
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
