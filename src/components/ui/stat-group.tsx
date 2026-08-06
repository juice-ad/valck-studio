import * as React from "react"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export interface StatItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number | string
  alert?: boolean
  onClick?: () => void
}

export function StatGroup({
  title,
  items,
}: {
  title: string
  items: StatItem[]
}) {
  return (
    <Card data-slot="stat-group">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon
          const numericValue =
            typeof item.value === "string"
              ? parseFloat(item.value.replace(/[^0-9.-]+/g, ""))
              : item.value
          const hasValue = numericValue > 0

          return (
            <button
              key={item.label}
              onClick={item.onClick}
              className={cn(
                "flex w-full items-center justify-between rounded-lg p-3 transition-all hover:bg-muted",
                item.alert && "bg-orange-50 hover:bg-orange-50"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "rounded-lg p-2",
                    item.alert
                      ? "bg-orange-100 text-orange-600"
                      : hasValue
                        ? "bg-secondary text-foreground"
                        : "bg-muted text-muted-foreground/60"
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <span className="text-sm text-muted-foreground">
                  {item.label}
                </span>
              </div>
              <span
                className={cn(
                  "text-lg font-bold",
                  item.alert
                    ? "text-orange-600"
                    : hasValue
                      ? "text-foreground"
                      : "text-muted-foreground/40"
                )}
              >
                {item.value}
              </span>
            </button>
          )
        })}
      </CardContent>
    </Card>
  )
}
