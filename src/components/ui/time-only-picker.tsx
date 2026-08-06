import * as React from "react"
import { Clock } from "lucide-react"

import { cn } from "@/lib/utils"

interface TimeOnlyPickerProps {
  value: string // "HH:mm"
  onChange: (value: string) => void
  className?: string
}

/**
 * Compact standalone time picker for "HH:mm" string values.
 * Renders as a single input-sized element that fits inline with other form fields.
 */
export function TimeOnlyPicker({
  value,
  onChange,
  className,
}: TimeOnlyPickerProps) {
  const [hours, minutes] = React.useMemo(() => {
    if (!value) return ["00", "00"]
    const parts = value.split(":")
    return [parts[0] || "00", parts[1] || "00"]
  }, [value])

  const updateTime = React.useCallback(
    (newHours: string, newMinutes: string) => {
      onChange(`${newHours}:${newMinutes}`)
    },
    [onChange]
  )

  const handleHourKey = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      e.preventDefault()
      const h = parseInt(hours, 10)
      if (e.key === "ArrowUp") {
        updateTime(String((h + 1) % 24).padStart(2, "0"), minutes)
      } else if (e.key === "ArrowDown") {
        updateTime(String((h - 1 + 24) % 24).padStart(2, "0"), minutes)
      } else if (e.key >= "0" && e.key <= "9") {
        // Two-keystroke entry: first key → tens digit, second → units
        const newVal = hours.slice(1) + e.key
        const num = parseInt(newVal, 10)
        updateTime(String(Math.min(num, 23)).padStart(2, "0"), minutes)
      }
    },
    [hours, minutes, updateTime]
  )

  const handleMinuteKey = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      e.preventDefault()
      const m = parseInt(minutes, 10)
      if (e.key === "ArrowUp") {
        updateTime(hours, String((m + 1) % 60).padStart(2, "0"))
      } else if (e.key === "ArrowDown") {
        updateTime(hours, String((m - 1 + 60) % 60).padStart(2, "0"))
      } else if (e.key >= "0" && e.key <= "9") {
        const newVal = minutes.slice(1) + e.key
        const num = parseInt(newVal, 10)
        updateTime(hours, String(Math.min(num, 59)).padStart(2, "0"))
      }
    },
    [hours, minutes, updateTime]
  )

  return (
    <div
      data-slot="time-only-picker"
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-2",
        className
      )}
    >
      <Clock className="size-4 shrink-0 text-muted-foreground" />
      <input
        type="text"
        inputMode="numeric"
        value={hours}
        readOnly
        onKeyDown={handleHourKey}
        className="w-6 rounded border-none bg-transparent text-center font-mono text-sm tabular-nums caret-transparent outline-none focus:bg-muted"
      />
      <span className="text-sm text-muted-foreground">:</span>
      <input
        type="text"
        inputMode="numeric"
        value={minutes}
        readOnly
        onKeyDown={handleMinuteKey}
        className="w-6 rounded border-none bg-transparent text-center font-mono text-sm tabular-nums caret-transparent outline-none focus:bg-muted"
      />
    </div>
  )
}
