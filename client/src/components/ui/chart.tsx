"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"

// Chart Container
const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: Record<string, any>
  }
>(({ className, children, config, ...props }, ref) => {
  return (
    <div 
      ref={ref} 
      className={cn("", className)} 
      style={
        {
          "--color-desktop": "hsl(var(--chart-1))",
          "--color-mobile": "hsl(var(--chart-2))",
          "--color-received": "hsl(142, 76%, 36%)",
          "--color-pending": "hsl(48, 96%, 53%)", 
          "--color-newStudents": "hsl(221, 83%, 53%)",
          "--color-totalStudents": "hsl(142, 76%, 36%)",
        } as React.CSSProperties
      }
      {...props}
    >
      {children}
    </div>
  )
})
ChartContainer.displayName = "ChartContainer"

// Chart Tooltip
const ChartTooltip = RechartsPrimitive.Tooltip

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> & {
    labelFormatter?: (value: any) => string
    formatter?: (value: any, name: string) => [string, string]
    indicator?: "line" | "dot" | "dashed"
  }
>(({ labelFormatter, formatter, indicator = "dot", ...props }, ref) => {
  return (
    <div
      ref={ref}
      className="rounded-lg border bg-background p-2 shadow-sm"
    >
      <RechartsPrimitive.Tooltip
        labelFormatter={labelFormatter}
        formatter={formatter}
        {...props}
      />
    </div>
  )
})
ChartTooltipContent.displayName = "ChartTooltipContent"

// Chart Legend
const ChartLegend = RechartsPrimitive.Legend

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex items-center justify-center gap-4", className)}
      {...props}
    />
  )
})
ChartLegendContent.displayName = "ChartLegendContent"

export type ChartConfig = Record<string, {
  label?: React.ReactNode
  color?: string
}>

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
}