import * as React from "react"
import { format, isValid } from "date-fns"

import { DateTimePickerBase } from "@/components/ui/datetime-picker-base"

interface DateTimePickerProps {
  value: string // "yyyy-MM-ddTHH:mm"
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

/**
 * DateTime picker wrapper that works with string values ("yyyy-MM-ddTHH:mm").
 * Internally uses DateTimePickerBase with calendar + time inputs.
 */
export function DateTimePicker({
  value,
  onChange,
  placeholder = "Selecteer datum & tijd",
  disabled,
  className,
}: DateTimePickerProps) {
  const dateValue = React.useMemo(() => {
    if (!value) return undefined
    const d = new Date(value)
    return isValid(d) ? d : undefined
  }, [value])

  const handleChange = React.useCallback(
    (date: Date | undefined) => {
      if (!date) return
      onChange(format(date, "yyyy-MM-dd'T'HH:mm"))
    },
    [onChange]
  )

  return (
    <DateTimePickerBase
      value={dateValue}
      onChange={handleChange}
      granularity="minute"
      placeholder={placeholder}
      disabled={disabled}
      className={className}
    />
  )
}
