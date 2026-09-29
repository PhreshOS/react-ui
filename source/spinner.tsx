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

/** How strongly each piece of the comet shows, from its head back along its tail. */
const tail = [1, 0.78, 0.58, 0.4, 0.24, 0.12] as const

/** One turn quickens and slows the way the interface's own motion does. */
const turning = "cubic-bezier(0.45, 0, 0.25, 1)"

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
  // A comet. Every piece of it makes the same eased turn, each a moment after the piece ahead, so
  // the tail stretches as the comet quickens and gathers into the head as it slows, while the whole
  // drifts so it never slows twice in one place. Each piece turns by itself as a whole element,
  // which the browser moves without drawing again. Without motion it rests as its shape.
  // A turn is one and a half repeating loops, and each piece a twelfth of it behind the one ahead,
  // so the tail stretches nearly half way round before it gathers again.
  const loop = loopDuration(metrics.visual) * 1.5
  const moving = metrics.visual.duration > 0
  const lag = loop / 12
  const indicator = <>
    <MotionStyle />
    <div data-spinner-indicator="" aria-hidden="true" style={{ position: "relative", width: "100%", height: "100%", animation: moving ? `phreshos-ui-spin ${loop * 3}ms linear infinite` : undefined }}>
      {tail.map((strength, index) => <div key={index} data-spinner-part={index === 0 ? "head" : "tail"} style={{
        position: "absolute",
        inset: 0,
        opacity: strength,
        ...moving
          ? { animation: `phreshos-ui-spin ${loop}ms ${turning} ${index * lag - loop}ms infinite` }
          : { rotate: `${-index * 9}deg` }
      }}>
        <svg focusable="false" viewBox="0 0 24 24" width="100%" height="100%" fill="none" style={{ display: "block" }}>
          <circle cx="12" cy="12" r="9" pathLength="100" stroke={arc} strokeWidth="3" strokeLinecap="round" strokeDasharray="7 93" />
        </svg>
      </div>).reverse()}
    </div>
  </>

  if (decorative) return <div {...properties} ref={ref} aria-hidden="true" className={className} style={rootStyle}>{indicator}</div>

  return <AriaProgressBar {...properties} ref={ref} aria-label={label} className={className} isIndeterminate style={rootStyle}>{indicator}</AriaProgressBar>
})
