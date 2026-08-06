import * as React from "react"
import { useInView, useMotionValue, useSpring } from "motion/react"

interface CountUpProps {
  /** Target number to count up to */
  to: number
  /** Animation duration in seconds (default 1.5) */
  duration?: number
  /** Number of decimals (default 0) */
  decimals?: number
  /** Thousands separator (default ".") */
  separator?: string
  /** Decimal separator (default ",") */
  decimalSeparator?: string
}

function formatNumber(
  value: number,
  decimals: number,
  separator: string,
  decimalSeparator: string
): string {
  const fixed = value.toFixed(decimals)
  const [intPart, decPart] = fixed.split(".")
  const withSeparator = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator)
  return decPart !== undefined
    ? `${withSeparator}${decimalSeparator}${decPart}`
    : withSeparator
}

export function CountUp({
  to,
  duration = 1.5,
  decimals = 0,
  separator = ".",
  decimalSeparator = ",",
}: CountUpProps) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: "0px" })

  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, {
    duration: duration * 1000,
    bounce: 0,
  })

  const [display, setDisplay] = React.useState(() =>
    formatNumber(0, decimals, separator, decimalSeparator)
  )

  React.useEffect(() => {
    if (isInView) {
      motionValue.set(to)
    }
  }, [isInView, to, motionValue])

  React.useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      setDisplay(formatNumber(latest, decimals, separator, decimalSeparator))
    })
    return unsubscribe
  }, [springValue, decimals, separator, decimalSeparator])

  return <span ref={ref}>{display}</span>
}
