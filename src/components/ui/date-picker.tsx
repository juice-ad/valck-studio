import * as React from "react"
import { format, isValid } from "date-fns"

import { DateTimePickerBase } from "@/components/ui/datetime-picker-base"

interface DatePickerProps {
  value: string // "YYYY-MM-DD"
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

/**
 * Date-only picker wrapper that works with string values ("YYYY-MM-DD").
 * Uses DateTimePickerBase with granularity="day" - time selection is hidden.
 */
export function DatePicker({
  value,
  onChange,
  placeholder = "Selecteer datum",
  disabled,
  className,
}: DatePickerProps) {
  // Parse "YYYY-MM-DD" to Date (use noon to avoid timezone issues)
  const dateValue = React.useMemo(() => {
    if (!value) return undefined
    const d = new Date(value + "T12:00:00")
    return isValid(d) ? d : undefined
  }, [value])

  const handleChange = React.useCallback(
    (date: Date | undefined) => {
      if (!date) return
      onChange(format(date, "yyyy-MM-dd"))
    },
    [onChange]
  )

  return (
    <DateTimePickerBase
      value={dateValue}
      onChange={handleChange}
      granularity="day"
      placeholder={placeholder}
      disabled={disabled}
      className={className}
    />
  )
}
