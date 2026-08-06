import * as React from "react"

import { cn } from "@/lib/utils"

const sizeClasses = {
  sm: "w-5 min-w-5 h-7 text-sm",
  md: "w-10 min-w-10 h-14 text-3xl",
  lg: "w-14 min-w-14 h-20 text-5xl",
  xl: "w-[5.5rem] min-w-[5.5rem] h-32 text-8xl",
}

const separatorSizes = {
  sm: "text-sm",
  md: "text-3xl",
  lg: "text-5xl",
  xl: "text-8xl",
}

type FlipClockSize = keyof typeof sizeClasses

interface FlipUnitProps {
  digit: string
  size?: FlipClockSize
  className?: string
}

const commonCardStyle =
  "absolute inset-x-0 overflow-hidden h-1/2 bg-inherit text-inherit"

function DigitSpan({
  children,
  position,
}: {
  children: React.ReactNode
  position: "top" | "bottom"
}) {
  return (
    <span
      className="absolute left-0 right-0 flex h-[200%] w-full items-center justify-center"
      style={{ top: position === "top" ? "0%" : "-100%" }}
    >
      {children}
    </span>
  )
}

const FlipUnit = React.memo(function FlipUnit({
  digit,
  size = "md",
  className,
}: FlipUnitProps) {
  const [prevDigit, setPrevDigit] = React.useState(digit)
  const [flipping, setFlipping] = React.useState(false)

  React.useEffect(() => {
    if (digit !== prevDigit) {
      setFlipping(true)
      const timer = setTimeout(() => {
        setFlipping(false)
        setPrevDigit(digit)
      }, 550)
      return () => clearTimeout(timer)
    }
  }, [digit, prevDigit])

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-foreground font-mono font-medium text-background subpixel-antialiased",
        sizeClasses[size],
        className
      )}
      style={{ perspective: "1000px" }}
    >
      <div className={cn(commonCardStyle, "top-0 rounded-t-lg")}>
        <DigitSpan position="top">{digit}</DigitSpan>
      </div>
      <div
        className={cn(commonCardStyle, "rounded-b-lg")}
        style={{ transform: "translateY(100%)" }}
      >
        <DigitSpan position="bottom">{prevDigit}</DigitSpan>
      </div>
      <div
        className={cn(
          commonCardStyle,
          "z-20 rounded-t-lg",
          flipping && "flip-top-anim"
        )}
        style={{ backfaceVisibility: "hidden", transformOrigin: "bottom" }}
      >
        <DigitSpan position="top">{prevDigit}</DigitSpan>
      </div>
      <div
        className={cn(
          commonCardStyle,
          "z-10 rounded-b-lg",
          flipping && "flip-bottom-anim"
        )}
        style={{
          backfaceVisibility: "hidden",
          transformOrigin: "top",
          transform: flipping ? undefined : "translateY(100%) rotateX(90deg)",
        }}
      >
        <DigitSpan position="bottom">{digit}</DigitSpan>
      </div>
      <div className="absolute top-1/2 left-0 z-30 h-px w-full -translate-y-1/2 bg-black/30" />
    </div>
  )
})

interface FlipClockProps {
  size?: FlipClockSize
  className?: string
}

const gapClasses = {
  sm: "gap-0.5",
  md: "gap-1",
  lg: "gap-1.5",
  xl: "gap-2",
}

export function FlipClock({ size = "md", className }: FlipClockProps) {
  const [time, setTime] = React.useState(() => {
    const now = new Date()
    return {
      hours: now.getHours(),
      minutes: now.getMinutes(),
      seconds: now.getSeconds(),
    }
  })

  React.useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      setTime((prev) => {
        if (
          prev.seconds === now.getSeconds() &&
          prev.minutes === now.getMinutes()
        )
          return prev
        return {
          hours: now.getHours(),
          minutes: now.getMinutes(),
          seconds: now.getSeconds(),
        }
      })
    }, 250)
    return () => clearInterval(timer)
  }, [])

  const h = String(time.hours).padStart(2, "0")
  const m = String(time.minutes).padStart(2, "0")
  const s = String(time.seconds).padStart(2, "0")

  return (
    <>
      <div
        className={cn(
          "inline-flex items-center font-mono font-medium",
          gapClasses[size],
          className
        )}
        aria-live="polite"
      >
        <span className="sr-only">{`${h}:${m}:${s}`}</span>
        <FlipUnit digit={h[0]} size={size} />
        <FlipUnit digit={h[1]} size={size} />
        <span
          className={cn(
            "-translate-y-[8%] text-center text-muted-foreground",
            separatorSizes[size]
          )}
        >
          :
        </span>
        <FlipUnit digit={m[0]} size={size} />
        <FlipUnit digit={m[1]} size={size} />
        <span
          className={cn(
            "-translate-y-[8%] text-center text-muted-foreground",
            separatorSizes[size]
          )}
        >
          :
        </span>
        <FlipUnit digit={s[0]} size={size} />
        <FlipUnit digit={s[1]} size={size} />
      </div>
      <style>{`
        .flip-top-anim {
          animation: flip-top 0.6s ease-in forwards;
        }
        .flip-bottom-anim {
          animation: flip-bottom 0.6s ease-out forwards;
        }
        @keyframes flip-top {
          0% { transform: rotateX(0deg); z-index: 30; }
          50%, 100% { transform: rotateX(-90deg); z-index: 10; }
        }
        @keyframes flip-bottom {
          0%, 50% { transform: translateY(100%) rotateX(90deg); z-index: 10; }
          100% { transform: translateY(100%) rotateX(0deg); z-index: 30; }
        }
      `}</style>
    </>
  )
}
