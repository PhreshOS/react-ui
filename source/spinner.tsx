import { forwardRef } from "react"
import type { CSSProperties } from "react"
import { ProgressBar as AriaProgressBar } from "react-aria-components"
import type { ProgressBarProps as AriaProgressBarProps } from "react-aria-components"
import { useControlMetrics } from "./control/control.js"
import { colorOpacity, resolveColor, type Color } from "./foundation/color.js"
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

/** Compact indeterminate progress, either named or explicitly decorative. */
export const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(function Spinner({
  className, color = "primary", decorative = false, label, size = "medium", style, ...properties
}, ref) {
  const metrics = useControlMetrics(size)
  const { colors } = metrics.visual
  // A standalone status stays visibly distinct from the compact control indicator.
  const diameter = metrics.visual.spacing + scale(metrics.visual.spacing, size)
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
    <svg data-spinner-indicator="" aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="100%" height="100%" fill="none"
      style={{ display: "block", animation: metrics.visual.duration > 0 ? `phreshos-ui-spin ${Math.max(600, metrics.visual.appearance.transaction.duration * 5)}ms linear infinite` : undefined }}>
      {/* The track belongs to whatever the Spinner sits on, so it is a veil of the arc itself. */}
      <circle data-spinner-track="" cx="12" cy="12" r="9" stroke={colorOpacity(arc, 0.2)} strokeWidth="3" />
      <circle data-spinner-fill="" cx="12" cy="12" r="9" pathLength="100" stroke={arc} strokeWidth="3" strokeLinecap="round" strokeDasharray="30 70" />
    </svg>
  </>

  if (decorative) return <div {...properties} ref={ref} aria-hidden="true" className={className} style={rootStyle}>{indicator}</div>

  return <AriaProgressBar {...properties} ref={ref} aria-label={label} className={className} isIndeterminate style={rootStyle}>{indicator}</AriaProgressBar>
})
