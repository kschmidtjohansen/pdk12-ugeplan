import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, children, ...props }, ref) => {
  const innerRef = React.useRef<HTMLDivElement | null>(null)
  const [indicator, setIndicator] = React.useState<{ left: number; width: number; top: number; height: number } | null>(null)

  React.useImperativeHandle(ref, () => innerRef.current as HTMLDivElement)

  React.useLayoutEffect(() => {
    const list = innerRef.current
    if (!list) return
    const update = () => {
      const active = list.querySelector<HTMLElement>('[role="tab"][data-state="active"]')
      if (!active) { setIndicator(null); return }
      setIndicator({ left: active.offsetLeft, width: active.offsetWidth, top: active.offsetTop, height: active.offsetHeight })
    }
    update()
    const mo = typeof MutationObserver !== "undefined" ? new MutationObserver(update) : null
    mo?.observe(list, { attributes: true, subtree: true, attributeFilter: ["data-state"], childList: true })
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null
    ro?.observe(list)
    return () => { mo?.disconnect(); ro?.disconnect() }
  }, [])

  return (
    <TabsPrimitive.List
      ref={innerRef}
      className={cn(
        "relative isolate inline-flex min-h-11 items-center justify-start gap-1 rounded-[1.375rem] border border-border/70 bg-card/80 p-1 text-muted-foreground shadow-flade",
        className
      )}
      {...props}
    >
      {children}
      {indicator && (
        <span
          aria-hidden
          data-tabs-indicator=""
          className="facet-tab-thumb pointer-events-none absolute -z-10 rounded-full motion-safe:transition-[left,top,width,height] motion-safe:duration-200 motion-safe:ease-facet"
          style={{ left: indicator.left, width: indicator.width, top: indicator.top, height: indicator.height }}
        />
      )}
    </TabsPrimitive.List>
  )
})
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium ring-offset-background transition-colors duration-140 ease-facet hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:font-semibold data-[state=active]:text-primary-strong",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
