import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:bg-accent focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 border border-transparent",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 ",
        outline:
          "border border-input bg-card text-foreground hover:bg-accent hover:border-ring",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "text-foreground hover:bg-accent",
        link:
          "text-primary underline-offset-4 hover:underline",
        success:
          "bg-success text-success-foreground hover:bg-success/90 ",
        warning:
          "bg-warning text-warning-foreground hover:bg-warning/90 ",
        info:
          "bg-info text-info-foreground hover:bg-info/90",
        brand:
          "bg-primary text-primary-foreground border border-transparent hover:bg-primary/90 active:bg-primary/80",
      },
      size: {
        default: "h-11 sm:h-9 px-4 py-2",
        sm: "h-11 sm:h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-5 text-sm",
        xl: "h-11 rounded-lg px-6 text-base",
        icon: "h-11 w-11 sm:h-9 sm:w-9",
        "icon-sm": "h-11 w-11 sm:h-8 sm:w-8 rounded-md",
        "icon-lg": "h-11 w-11 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <>
            <div aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span className="ml-2">{children}</span>
          </>
        ) : (
          children
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
