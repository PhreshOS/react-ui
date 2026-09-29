import { forwardRef } from "react"
import type { CSSProperties } from "react"
import { ProgressBar as AriaProgressBar } from "react-aria-components"
import type { ProgressBarProps as AriaProgressBarProps } from "react-aria-components"
import { useControlMetrics } from "./control/control.js"
import { resolveColor, type Color } from "./foundation/color.js"
import MotionStyle from "./foundation/motion-style.js"
import { scale, type ScaleLevel } from "./foundation/scale.js"

type NativeSpinnerProps = Omit<
  AriaProgressBarProps,
  "aria-hidden" | "aria-label" | "aria-labelledby" | "children" | "className" | "formatOptions"
  | "isIndeterminate" | "maxValue" | "minValue" | "slot" | "style" | "value" | "valueLabel"
>

interface SpinnerVisualProps extends NativeSpinnerProps {
  readonly className?: string
  /** Color of the moving arc. `currentColor` follows the surrounding content. */
  readonly color?: Color
  readonly size?: ScaleLevel
  readonly style?: CSSProperties
}

type NamedSpinnerProps = Readonly<{
  /** Accessible name announced with indeterminate progress semantics. */
  label: string
  decorative?: false
}>

type DecorativeSpinnerProps = Readonly<{
  /** Hides the Spinner when surrounding content already communicates progress. */
  decorative: true
  label?: never
}>

export type SpinnerProps = SpinnerVisualProps & (NamedSpinnerProps | DecorativeSpinnerProps)

/** How strongly each piece of the comet shows, from its head back along its tail. */
const tail = [1, 0.78, 0.58, 0.4, 0.24, 0.12] as const

/** A standalone status stays visibly distinct from the compact control indicator. */
export function spinnerDiameter(spacing: number, size: ScaleLevel): number {
  return spacing + scale(spacing, size)
}

/** Compact indeterminate progress, either named or explicitly decorative. */
export const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(function Spinner({
  className, color = "primary", decorative = false, label, size = "medium", style, ...properties
}, ref) {
  const metrics = useControlMetrics(size)
  const { colors } = metrics.visual
  const diameter = spinnerDiameter(metrics.visual.spacing, size)
  const arc = color === "currentColor" ? "currentColor" : resolveColor(color, colors)
  const rootStyle: CSSProperties = {
    display: "inline-grid",
    placeItems: "center",
    boxSizing: "border-box",
    flexShrink: 0,
    width: diameter,
    height: diameter,
    verticalAlign: "middle",
    ...style
  }
  // A comet: a head leading a tail that fades behind it, so the turn has no hard ends. One turn
  // lasts eight Appearance transactions, the interface's own rhythm drawn out; none without motion.
  const turn = Math.max(800, metrics.visual.appearance.transaction.duration * 8)
  const indicator = <>
    <MotionStyle />
    <svg data-spinner-indicator="" aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="100%" height="100%" fill="none"
      style={{ display: "block", animation: metrics.visual.duration > 0 ? `phreshos-ui-spin ${turn}ms linear infinite` : undefined }}>
      {tail.map((strength, index) => <circle key={index} data-spinner-part={index === 0 ? "head" : "tail"} cx="12" cy="12" r="9" pathLength="100"
        stroke={arc} strokeWidth="3" strokeDasharray="9 91" strokeDashoffset={index * 8} strokeLinecap={index === 0 ? "round" : "butt"}
        opacity={strength} />).reverse()}
    </svg>
  </>

  if (decorative) return <div {...properties} ref={ref} aria-hidden="true" className={className} style={rootStyle}>{indicator}</div>

  return <AriaProgressBar {...properties} ref={ref} aria-label={label} className={className} isIndeterminate style={rootStyle}>{indicator}</AriaProgressBar>
})
