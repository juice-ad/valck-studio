/**
 * DateTimePicker base - adapted from shadcn-ui-expansions.
 * Provides: DateTimePickerBase, TimePicker, TimePickerInput
 *
 * Defaults: locale=nl, hourCycle=24, granularity="minute"
 */
import * as React from "react"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import { Calendar as CalendarIcon, Clock } from "lucide-react"
import type { Locale } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// ─── Time utility functions ─────────────────────────────────────────────

function isValidHour(value: string) {
  return /^(0[0-9]|1[0-9]|2[0-3])$/.test(value)
}

function isValidMinuteOrSecond(value: string) {
  return /^[0-5][0-9]$/.test(value)
}

type GetValidNumberConfig = { max: number; min?: number; loop?: boolean }

function getValidNumber(
  value: string,
  { max, min = 0, loop = false }: GetValidNumberConfig
) {
  let numericValue = parseInt(value, 10)
  if (!Number.isNaN(numericValue)) {
    if (!loop) {
      if (numericValue > max) numericValue = max
      if (numericValue < min) numericValue = min
    } else {
      if (numericValue > max) numericValue = min
      if (numericValue < min) numericValue = max
    }
    return numericValue.toString().padStart(2, "0")
  }
  return "00"
}

function getValidHour(value: string) {
  if (isValidHour(value)) return value
  return getValidNumber(value, { max: 23 })
}

function getValidMinuteOrSecond(value: string) {
  if (isValidMinuteOrSecond(value)) return value
  return getValidNumber(value, { max: 59 })
}

type GetValidArrowNumberConfig = { min: number; max: number; step: number }

function getValidArrowNumber(
  value: string,
  { min, max, step }: GetValidArrowNumberConfig
) {
  let numericValue = parseInt(value, 10)
  if (!Number.isNaN(numericValue)) {
    numericValue += step
    return getValidNumber(String(numericValue), { min, max, loop: true })
  }
  return "00"
}

function getValidArrowHour(value: string, step: number) {
  return getValidArrowNumber(value, { min: 0, max: 23, step })
}

function getValidArrowMinuteOrSecond(value: string, step: number) {
  return getValidArrowNumber(value, { min: 0, max: 59, step })
}

type TimePickerType = "minutes" | "seconds" | "hours"

function setDateByType(date: Date, value: string, type: TimePickerType) {
  const d = new Date(date)
  switch (type) {
    case "minutes":
      d.setMinutes(parseInt(getValidMinuteOrSecond(value), 10))
      return d
    case "seconds":
      d.setSeconds(parseInt(getValidMinuteOrSecond(value), 10))
      return d
    case "hours":
      d.setHours(parseInt(getValidHour(value), 10))
      return d
    default:
      return d
  }
}

function getDateByType(date: Date | null, type: TimePickerType) {
  if (!date) return "00"
  switch (type) {
    case "minutes":
      return getValidMinuteOrSecond(String(date.getMinutes()))
    case "seconds":
      return getValidMinuteOrSecond(String(date.getSeconds()))
    case "hours":
      return getValidHour(String(date.getHours()))
    default:
      return "00"
  }
}

function getArrowByType(value: string, step: number, type: TimePickerType) {
  switch (type) {
    case "minutes":
    case "seconds":
      return getValidArrowMinuteOrSecond(value, step)
    case "hours":
      return getValidArrowHour(value, step)
    default:
      return "00"
  }
}

// ─── TimePickerInput ─────────────────────────────────────────────────────

interface TimePickerInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  picker: TimePickerType
  date?: Date | null
  onDateChange?: (date: Date | undefined) => void
  onRightFocus?: () => void
  onLeftFocus?: () => void
}

const TimePickerInput = React.forwardRef<
  HTMLInputElement,
  TimePickerInputProps
>(
  (
    {
      className,
      type = "tel",
      value,
      id,
      name,
      date = new Date(new Date().setHours(0, 0, 0, 0)),
      onDateChange,
      onChange,
      onKeyDown,
      picker,
      onLeftFocus,
      onRightFocus,
      ...props
    },
    ref
  ) => {
    const [flag, setFlag] = React.useState(false)

    React.useEffect(() => {
      if (flag) {
        const timer = setTimeout(() => setFlag(false), 2000)
        return () => clearTimeout(timer)
      }
    }, [flag])

    const calculatedValue = React.useMemo(
      () => getDateByType(date, picker),
      [date, picker]
    )

    const calculateNewValue = (key: string) => {
      return !flag ? `0${key}` : calculatedValue.slice(1, 2) + key
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Tab") return
      e.preventDefault()
      if (e.key === "ArrowRight") onRightFocus?.()
      if (e.key === "ArrowLeft") onLeftFocus?.()
      if (["ArrowUp", "ArrowDown"].includes(e.key)) {
        const step = e.key === "ArrowUp" ? 1 : -1
        const newValue = getArrowByType(calculatedValue, step, picker)
        if (flag) setFlag(false)
        const tempDate = date ? new Date(date) : new Date()
        onDateChange?.(setDateByType(tempDate, newValue, picker))
      }
      if (e.key >= "0" && e.key <= "9") {
        const newValue = calculateNewValue(e.key)
        if (flag) onRightFocus?.()
        setFlag((prev) => !prev)
        const tempDate = date ? new Date(date) : new Date()
        onDateChange?.(setDateByType(tempDate, newValue, picker))
      }
    }

    return (
      <Input
        ref={ref}
        id={id || picker}
        name={name || picker}
        className={cn(
          "w-[48px] text-center font-mono text-base tabular-nums caret-transparent [&::-webkit-inner-spin-button]:appearance-none",
          "focus:bg-muted focus:text-foreground",
          className
        )}
        value={value || calculatedValue}
        onChange={(e) => {
          e.preventDefault()
          onChange?.(e)
        }}
        type={type}
        inputMode="decimal"
        onKeyDown={(e) => {
          onKeyDown?.(e)
          handleKeyDown(e)
        }}
        {...props}
      />
    )
  }
)
TimePickerInput.displayName = "TimePickerInput"

// ─── TimePicker ──────────────────────────────────────────────────────────

type Granularity = "day" | "hour" | "minute" | "second"

interface TimePickerProps {
  date?: Date | null
  onChange?: (date: Date | undefined) => void
  granularity?: Granularity
}

interface TimePickerRef {
  minuteRef: HTMLInputElement | null
  hourRef: HTMLInputElement | null
  secondRef: HTMLInputElement | null
}

const TimePicker = React.forwardRef<TimePickerRef, TimePickerProps>(
  ({ date, onChange, granularity = "minute" }, ref) => {
    const minuteRef = React.useRef<HTMLInputElement>(null)
    const hourRef = React.useRef<HTMLInputElement>(null)
    const secondRef = React.useRef<HTMLInputElement>(null)

    React.useImperativeHandle(
      ref,
      () => ({
        minuteRef: minuteRef.current,
        hourRef: hourRef.current,
        secondRef: secondRef.current,
      }),
      []
    )

    return (
      <div className="flex items-center justify-center gap-2">
        <label htmlFor="datetime-picker-hour-input" className="cursor-pointer">
          <Clock className="mr-2 size-4 text-muted-foreground" />
        </label>
        <TimePickerInput
          picker="hours"
          date={date}
          id="datetime-picker-hour-input"
          onDateChange={onChange}
          ref={hourRef}
          onRightFocus={() => minuteRef?.current?.focus()}
        />
        {(granularity === "minute" || granularity === "second") && (
          <>
            <span className="text-muted-foreground">:</span>
            <TimePickerInput
              picker="minutes"
              date={date}
              onDateChange={onChange}
              ref={minuteRef}
              onLeftFocus={() => hourRef?.current?.focus()}
              onRightFocus={() => secondRef?.current?.focus()}
            />
          </>
        )}
        {granularity === "second" && (
          <>
            <span className="text-muted-foreground">:</span>
            <TimePickerInput
              picker="seconds"
              date={date}
              onDateChange={onChange}
              ref={secondRef}
              onLeftFocus={() => minuteRef?.current?.focus()}
            />
          </>
        )}
      </div>
    )
  }
)
TimePicker.displayName = "TimePicker"

// ─── DateTimePickerBase (main component) ─────────────────────────────────

type DateTimePickerBaseProps = {
  value?: Date
  onChange?: (date: Date | undefined) => void
  disabled?: boolean
  placeholder?: string
  yearRange?: number
  granularity?: Granularity
  className?: string
  /** Format string for the trigger button display. Default: "d MMM yyyy HH:mm" */
  displayFormat?: string
  locale?: Partial<Locale>
  showOutsideDays?: boolean
}

type DateTimePickerBaseRef = {
  value?: Date
} & Omit<HTMLButtonElement, "value">

const DateTimePickerBase = React.forwardRef<
  Partial<DateTimePickerBaseRef>,
  DateTimePickerBaseProps
>(
  (
    {
      locale = nl,
      value,
      onChange,
      disabled = false,
      placeholder = "Selecteer datum",
      yearRange = 50,
      granularity = "minute",
      className,
      displayFormat,
      showOutsideDays = true,
    },
    ref
  ) => {
    const defaultDate = new Date(new Date().setHours(0, 0, 0, 0))
    const [month, setMonth] = React.useState<Date>(value ?? defaultDate)
    const buttonRef = React.useRef<HTMLButtonElement>(null)
    const [displayDate, setDisplayDate] = React.useState<Date | undefined>(
      value ?? undefined
    )

    React.useEffect(() => {
      setDisplayDate(value)
      if (value) setMonth(value)
    }, [value])

    const handleMonthChange = (newDay: Date | undefined) => {
      if (!newDay) return
      newDay.setHours(
        month?.getHours() ?? 0,
        month?.getMinutes() ?? 0,
        month?.getSeconds() ?? 0
      )
      setMonth(newDay)
    }

    const onSelect = (newDay?: Date) => {
      if (!newDay) return
      // Preserve the current time when selecting a new date
      newDay.setHours(
        month?.getHours() ?? 0,
        month?.getMinutes() ?? 0,
        month?.getSeconds() ?? 0
      )
      onChange?.(newDay)
      setMonth(newDay)
      setDisplayDate(newDay)
    }

    React.useImperativeHandle(
      ref,
      () => ({
        ...buttonRef.current,
        value: displayDate,
      }),
      [displayDate]
    )

    // Determine display format based on granularity
    const fmt =
      displayFormat ??
      (granularity === "day"
        ? "d MMM yyyy"
        : granularity === "hour"
          ? "d MMM yyyy HH:00"
          : granularity === "second"
            ? "d MMM yyyy HH:mm:ss"
            : "d MMM yyyy HH:mm")

    let loc = nl
    const { options, localize, formatLong } = locale || {}
    if (options && localize && formatLong) {
      loc = { ...nl, options, localize, formatLong }
    }

    const today = new Date()
    const startMonth = new Date(today.getFullYear() - yearRange, 0)
    const endMonth = new Date(today.getFullYear() + yearRange, 11)

    return (
      <Popover>
        <PopoverTrigger asChild disabled={disabled}>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start px-3 py-2 text-left font-normal",
              !displayDate && "text-muted-foreground",
              className
            )}
            ref={buttonRef}
          >
            <CalendarIcon className="mr-2 size-4 shrink-0 text-muted-foreground" />
            {displayDate ? (
              format(displayDate, fmt, { locale: loc })
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={displayDate}
            month={month}
            onSelect={(newDate) => {
              if (newDate) {
                onSelect(newDate)
              }
            }}
            onMonthChange={handleMonthChange}
            captionLayout="dropdown"
            startMonth={startMonth}
            endMonth={endMonth}
            locale={locale}
            showOutsideDays={showOutsideDays}
          />
          {granularity !== "day" && (
            <div className="border-t p-3">
              <TimePicker
                onChange={(value) => {
                  onChange?.(value)
                  setDisplayDate(value)
                  if (value) setMonth(value)
                }}
                date={month}
                granularity={granularity}
              />
            </div>
          )}
        </PopoverContent>
      </Popover>
    )
  }
)
DateTimePickerBase.displayName = "DateTimePickerBase"

export { DateTimePickerBase, TimePicker, TimePickerInput }
export type {
  Granularity,
  TimePickerType,
  DateTimePickerBaseProps,
  DateTimePickerBaseRef,
  TimePickerProps,
}
