import { forwardRef } from "react"
import type { CSSProperties, ReactNode } from "react"
import { Label, ProgressBar as AriaProgressBar } from "react-aria-components"
import type { ProgressBarProps as AriaProgressBarProps } from "react-aria-components"
import { controlFontWeight, controlOpacity, transition, useControlMetrics } from "./control/control.js"
import { fieldStyle } from "./control/field.js"
import { resolveColor, type Color } from "./foundation/color.js"
import MotionStyle from "./foundation/motion-style.js"
import type { ScaleLevel } from "./foundation/scale.js"
import type { MaterialOverrides } from "./surface/material-options.js"
import { SurfaceView } from "./surface/surface.js"

type NativeProgressBarProps = Omit<AriaProgressBarProps, "children" | "className" | "isIndeterminate" | "style">

export interface ProgressBarProps extends NativeProgressBarProps, MaterialOverrides {
  readonly className?: string
  /** Color of the completed or moving portion. */
  readonly color?: Color
  /** Shows progress without asserting a current value. */
  readonly indeterminate?: boolean
  /** Visible label associated with the progress value. */
  readonly label?: ReactNode
  readonly size?: ScaleLevel
  readonly style?: CSSProperties
}

/** Progress over time: a recessed rail filled in the owner's color. */
export const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(function ProgressBar({
  className,
  color = "primary",
  indeterminate = false,
  label,
  material,
  size,
  style,
  value,
  minValue = 0,
  maxValue = 100,
  ...properties
}, ref) {
  const metrics = useControlMetrics(size)
  const thickness = Math.max(4, Math.round(metrics.spacing / 2))
  const fill = resolveColor(color, metrics.visual.colors)
  const moving = indeterminate && metrics.visual.duration > 0

  return <AriaProgressBar
    {...properties}
    ref={ref}
    className={className}
    value={value}
    minValue={minValue}
    maxValue={maxValue}
    isIndeterminate={indeterminate}
    style={fieldStyle(metrics, { width: "100%", ...style })}
  >{state => {
    const output = properties.valueLabel ?? state.valueText
    const heading = label != null || (!state.isIndeterminate && output != null)

    return <>
      <MotionStyle />
      {heading && <span style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: metrics.gap }}>
        {label != null && <Label style={{ fontWeight: controlFontWeight }}>{label}</Label>}
        {!state.isIndeterminate && output != null && <span style={{ fontVariantNumeric: "tabular-nums", opacity: controlOpacity.secondary }}>{output}</span>}
      </span>}
      <SurfaceView as="span" aria-hidden="true" data-progress-track="" color="background" depth="recessed" material={material} radius="full"
        style={{ display: "block", height: thickness, overflow: "hidden" }}>
        <span data-progress-fill="" style={{
          ...transition(metrics.visual, "width", 1.5),
          position: "absolute",
          insetBlock: 0,
          insetInlineStart: state.isIndeterminate ? "30%" : 0,
          display: "block",
          width: state.isIndeterminate ? "40%" : `${state.percentage ?? 0}%`,
          borderRadius: "inherit",
          background: fill,
          animation: moving ? `phreshos-ui-sweep ${Math.max(900, metrics.visual.appearance.transaction.duration * 8)}ms ${metrics.visual.easing} infinite` : undefined
        }} />
      </SurfaceView>
    </>
  }}</AriaProgressBar>
})
