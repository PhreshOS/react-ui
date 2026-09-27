import { forwardRef } from "react"
import type { CSSProperties, ReactNode } from "react"
import { Label, Meter as AriaMeter, type MeterProps as AriaMeterProps } from "react-aria-components"
import { controlFontWeight, controlOpacity, transition, useControlMetrics } from "./control/control.js"
import { fieldStyle } from "./control/field.js"
import { resolveColor, type Color } from "./foundation/color.js"
import type { ScaleLevel } from "./foundation/scale.js"
import { railThickness } from "./progress-bar.js"
import type { MaterialOverrides } from "./surface/material-options.js"
import { SurfaceView } from "./surface/surface.js"

type NativeMeterProps = Omit<AriaMeterProps, "children" | "className" | "style">

export interface MeterProps extends NativeMeterProps, MaterialOverrides {
  readonly className?: string
  /** Color of the measured portion while no threshold is reached. */
  readonly color?: Color
  /** From this share of the range, between 0 and 1, the measure turns `warning`. */
  readonly warning?: number
  /** From this share of the range, between 0 and 1, the measure turns `danger`. */
  readonly danger?: number
  /** Visible label associated with the measured value. */
  readonly label?: ReactNode
  readonly size?: ScaleLevel
  readonly style?: CSSProperties
}

/**
 * A quantity within a known range, such as disk usage. Unlike a ProgressBar it
 * does not move toward an end: it reads a level, and turns `warning` or
 * `danger` once it crosses the thresholds it is given.
 */
export const Meter = forwardRef<HTMLDivElement, MeterProps>(function Meter({
  className,
  color = "info",
  warning,
  danger,
  label,
  material,
  size,
  style,
  value = 0,
  minValue = 0,
  maxValue = 100,
  ...properties
}, ref) {
  const metrics = useControlMetrics(size)
  const share = maxValue === minValue ? 0 : (value - minValue) / (maxValue - minValue)
  const role: Color = danger !== undefined && share >= danger ? "danger" : warning !== undefined && share >= warning ? "warning" : color
  const fill = resolveColor(role, metrics.visual.colors)

  return <AriaMeter
    {...properties}
    ref={ref}
    className={className}
    value={value}
    minValue={minValue}
    maxValue={maxValue}
    style={fieldStyle(metrics, { width: "100%", ...style })}
  >{state => <>
    {(label != null || state.valueText != null) && <span style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: metrics.gap }}>
      {label != null && <Label style={{ fontWeight: controlFontWeight }}>{label}</Label>}
      {state.valueText != null && <span style={{ fontVariantNumeric: "tabular-nums", opacity: controlOpacity.secondary }}>{state.valueText}</span>}
    </span>}
    <SurfaceView as="span" aria-hidden="true" data-meter-track="" color="background" depth="recessed" material={material} radius="full"
      style={{ display: "block", height: railThickness(metrics), overflow: "hidden" }}>
      <span data-meter-fill="" style={{
        ...transition(metrics.visual, "width, background-color", 1.5),
        position: "absolute",
        insetBlock: 0,
        insetInlineStart: 0,
        display: "block",
        width: `${state.percentage}%`,
        borderRadius: "inherit",
        background: fill
      }} />
    </SurfaceView>
  </>}</AriaMeter>
})
