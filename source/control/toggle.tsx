import type { CSSProperties } from "react"
import { lightColor, type Color } from "../foundation/color.js"
import type { Direction } from "../foundation/direction.js"
import type { MaterialOverrides } from "../surface/material-options.js"
import { SurfaceView } from "../surface/surface.js"
import { resolveRadius, type Radius } from "../foundation/radius.js"
import { isScaleLevel, type ScaleLevel } from "../foundation/scale.js"
import { proportionalRadius, transition, type ControlMetrics } from "./control.js"

export type ToggleState = Readonly<{
  selected: boolean
  indeterminate?: boolean
  hovered: boolean
  pressed: boolean
  focusVisible: boolean
  invalid: boolean
  disabled: boolean
}>

/**
 * The indicator shared by Checkbox, Radio, and Switch. Off, it is a recessed
 * bed; on, the same Surface rises in the owner's color. Its mark is painted in
 * that Surface's readable content color.
 */
export function ToggleIndicator({ color, direction = "ltr", kind, material, metrics, radius, state }: Readonly<{
  color: Color
  direction?: Direction
  kind: "checkbox" | "radio" | "switch"
  material: MaterialOverrides["material"]
  metrics: ControlMetrics
  /** A checkbox's corners; radio and switch shapes are round by meaning. */
  radius?: Radius
  state: ToggleState
}>) {
  const on = state.selected || state.indeterminate === true
  const size = metrics.indicator
  const switching = kind === "switch"
  const width = switching ? Math.round(size * 1.8) : size
  const thumb = size - 6
  const stretch = state.pressed && metrics.visual.duration > 0 ? 3 : 0
  const travel = (width - thumb - 6 - stretch) * (direction === "rtl" ? -1 : 1)
  const interactive = !state.disabled

  return <SurfaceView
    as="span"
    aria-hidden="true"
    color={on ? color : "background"}
    depth={on ? "raised" : "recessed"}
    material={material}
    shadow={on && !switching}
    radius={kind !== "checkbox"
      ? "full"
      : isScaleLevel(radius ?? "medium")
        ? proportionalRadius(metrics.visual, size, (radius ?? "medium") as ScaleLevel)
        : resolveRadius(radius, metrics.visual.radius)}
    interaction={{
      hovered: interactive && state.hovered,
      pressed: interactive && state.pressed,
      focusVisible: state.focusVisible,
      invalid: state.invalid
    }}
    style={{
      ...transition(metrics.visual, "scale, outline-color"),
      display: "inline-grid",
      placeItems: "center",
      flexShrink: 0,
      width,
      height: size,
      scale: state.pressed && interactive && !switching ? "0.92" : "1"
    }}
  >
    {kind === "checkbox" && <svg viewBox="0 0 16 16" width={size - 6} height={size - 6} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 8.5 3 3 7-7" pathLength={1} style={drawn(metrics, state.selected && state.indeterminate !== true)} />
      <path d="M4 8h8" pathLength={1} style={drawn(metrics, state.indeterminate === true)} />
    </svg>}
    {kind === "radio" && <span style={{
      ...transition(metrics.visual, "scale"),
      width: Math.round(size / 3),
      height: Math.round(size / 3),
      borderRadius: "50%",
      background: "currentColor",
      scale: on ? "1" : "0"
    }} />}
    {switching && <SurfaceView
      as="span"
      // A thumb is lit from above in every Theme, so it takes the lighter Appearance color.
      color={lightColor(metrics.visual.colors)}
      radius="full"
      style={{
        ...transition(metrics.visual, "translate, width", 1.2),
        position: "absolute",
        top: 3,
        insetInlineStart: 3,
        zIndex: 2,
        width: thumb + stretch,
        height: thumb,
        translate: on ? `${direction === "rtl" ? -Math.abs(travel) : travel}px 0` : "0 0"
      }}
    />}
  </SurfaceView>
}

/** A mark drawn along its path when it appears and withdrawn when it leaves. */
function drawn(metrics: ControlMetrics, visible: boolean): CSSProperties {
  return {
    ...transition(metrics.visual, "stroke-dashoffset", 1.4),
    strokeDasharray: 1,
    strokeDashoffset: visible ? 0 : 1
  }
}

/** The pressable row that pairs one indicator with its label. */
export function toggleRowStyle(metrics: ControlMetrics, disabled: boolean, readOnly: boolean): CSSProperties {
  return {
    // React Aria visually hides the focusable input with absolute positioning;
    // anchoring it here keeps focus from scrolling an ancestor toward it.
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: metrics.gap,
    minHeight: Math.max(metrics.indicator, Math.round(metrics.height * 0.75)),
    width: "fit-content",
    cursor: disabled ? "not-allowed" : readOnly ? "default" : "pointer",
    WebkitTapHighlightColor: "transparent"
  }
}
