import * as React from "react"
import { cn } from "@/lib/utils"

/** Cult UI-inspired pulsing status dot: signals "active right now". */
const LiveDot: React.FC<{ className?: string; tone?: "success" | "info" | "primary" }> = ({ className, tone = "success" }) => {
  const toneClass = { success: "bg-success", info: "bg-info", primary: "bg-primary" }[tone]
  return (
    <span aria-hidden className={cn("relative inline-flex h-2 w-2 shrink-0", className)}>
      <span className={cn("absolute inset-0 rounded-full motion-safe:animate-live-ping", toneClass)} />
      <span className={cn("relative inline-flex h-2 w-2 rounded-full", toneClass)} />
    </span>
  )
}

export { LiveDot }
