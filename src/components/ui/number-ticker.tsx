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

/**
 * Magic UI-inspired rolling number. Animates from the previous value to the new one.
 * The animation runs on requestAnimationFrame, which browsers pause in hidden tabs; the number must never
 * be left half-way (it once showed 2 instead of 4 on the dashboard), so the final value is set when the tab
 * is hidden and again by a timer right after the animation should have ended.
 */
const NumberTicker: React.FC<NumberTickerProps> = ({ value, duration = 600, className, ...props }) => {
  const [display, setDisplay] = React.useState(value)
  const fromRef = React.useRef(value)

  React.useEffect(() => {
    const from = fromRef.current
    fromRef.current = value
    const hidden = typeof document !== "undefined" && document.visibilityState === "hidden"
    if (from === value || hidden || prefersReducedMotion() || typeof requestAnimationFrame !== "function") {
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
    const settle = setTimeout(() => { cancelAnimationFrame(frame); setDisplay(value) }, duration + 150)
    return () => { cancelAnimationFrame(frame); clearTimeout(settle) }
  }, [value, duration])

  return (
    <span className={cn("tabular-nums", className)} {...props}>
      {display}
    </span>
  )
}

export { NumberTicker }
