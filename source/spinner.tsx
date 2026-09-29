import { forwardRef } from "react"
import type { CSSProperties } from "react"
import { ProgressBar as AriaProgressBar } from "react-aria-components"
import type { ProgressBarProps as AriaProgressBarProps } from "react-aria-components"
import { useControlMetrics } from "./control/control.js"
import { resolveColor, type Color } from "./foundation/color.js"
import MotionStyle, { loopDuration } from "./foundation/motion-style.js"
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
  const indicator = <>
    <MotionStyle />
    {/* A ring missing its last quarter, turning at an even pace once every repeating motion's loop. */}
    <svg data-spinner-indicator="" aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="100%" height="100%" fill="none"
      style={{ display: "block", animation: metrics.visual.duration > 0 ? `phreshos-ui-spin ${loopDuration(metrics.visual)}ms linear infinite` : undefined }}>
      <circle data-spinner-fill="" cx="12" cy="12" r="11" pathLength="100" stroke={arc} strokeWidth="2" strokeDasharray="75 25" transform="rotate(-90 12 12)" />
    </svg>
  </>

  if (decorative) return <div {...properties} ref={ref} aria-hidden="true" className={className} style={rootStyle}>{indicator}</div>

  return <AriaProgressBar {...properties} ref={ref} aria-label={label} className={className} isIndeterminate style={rootStyle}>{indicator}</AriaProgressBar>
})
