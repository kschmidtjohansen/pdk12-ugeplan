import * as React from "react"
import { cn } from "@/lib/utils"

interface NumberTickerProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: number
  /** Animation duration in ms. */
  duration?: number
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches

/** Magic UI-inspired rolling number. Animates from the previous value to the new one. */
const NumberTicker: React.FC<NumberTickerProps> = ({ value, duration = 600, className, ...props }) => {
  const [display, setDisplay] = React.useState(value)
  const fromRef = React.useRef(value)

  React.useEffect(() => {
    const from = fromRef.current
    fromRef.current = value
    if (from === value || prefersReducedMotion() || typeof requestAnimationFrame !== "function") {
      setDisplay(value)
      return
    }
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(Math.round(from + (value - from) * eased))
      if (p < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, duration])

  return (
    <span className={cn("tabular-nums", className)} {...props}>
      {display}
    </span>
  )
}

export { NumberTicker }
