import { useState } from "react"
import type { FocusEvent, ReactNode } from "react"
import { DateInput, DateSegment, Group } from "react-aria-components"
import type { DateSegmentRenderProps } from "react-aria-components"
import { controlOpacity, transition, type ControlMetrics } from "./control/control.js"
import { colorLevel, readableColor, type Color } from "./foundation/color.js"
import type { MaterialOverrides } from "./surface/material-options.js"
import { SurfaceView } from "./surface/surface.js"

/** The recessed well shared by every date and time field. */
export function DateControl({
  active = false, children, color, disabled, end, endFocusVisible, endRequiresVisibleFocus = false,
  group = false, invalid, material, metrics
}: Readonly<{
  active?: boolean
  children?: ReactNode
  color: Color
  disabled: boolean
  end?: ReactNode
  endFocusVisible?: boolean
  endRequiresVisibleFocus?: boolean
  group?: boolean
  invalid: boolean
  material: MaterialOverrides["material"]
  metrics: ControlMetrics
}>) {
  const [focused, setFocused] = useState(false)
  const [endFocused, setEndFocused] = useState(false)
  const [hovered, setHovered] = useState(false)
  // Popovers restore trigger focus after pointer dismissal; only keyboard-visible
  // focus on that end control should reactivate the field.
  const engaged = active || (focused && (!endFocused || !endRequiresVisibleFocus || endFocusVisible === true))

  const surface = {
    color,
    depth: "recessed" as const,
    material,
    radius: metrics.radius,
    interaction: { hovered, focusVisible: engaged, invalid, disabled },
    onFocusCapture: (event: FocusEvent<HTMLDivElement>) => {
      setFocused(true)
      setEndFocused(event.target instanceof Element && event.target.closest("[data-date-control-end]") != null)
    },
    onBlurCapture: (event: FocusEvent<HTMLDivElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget)) {
        setFocused(false)
        setEndFocused(false)
      }
    },
    onPointerEnter: () => setHovered(true),
    onPointerLeave: () => setHovered(false),
    style: {
      display: "flex",
      alignItems: "center",
      boxSizing: "border-box",
      height: metrics.height,
      paddingInline: metrics.inset,
      cursor: disabled ? "not-allowed" : "text"
    } as const
  }
  const content = <>
    {children ?? <DateSegments metrics={metrics} />}
    {end}
  </>

  return group
    ? <SurfaceView as={Group} {...surface}>{content}</SurfaceView>
    : <SurfaceView {...surface}>{content}</SurfaceView>
}

/** Segmented input used once for a date and twice for a date range. */
export function DateSegments({ compact = false, metrics, slot }: Readonly<{
  compact?: boolean
  metrics: ControlMetrics
  slot?: "start" | "end"
}>) {
  return <DateInput slot={slot} style={{ display: "flex", alignItems: "center", flex: compact ? "0 1 auto" : "1 1 auto", minWidth: 0 }}>
    {segment => <DateSegment segment={segment} style={state => segmentStyle(metrics, state)} />}
  </DateInput>
}

function segmentStyle(metrics: ControlMetrics, state: DateSegmentRenderProps) {
  const { colors } = metrics.visual
  const selected = state.isFocused ? colorLevel(colors.primary, "soft", colors) : null

  return {
    ...transition(metrics.visual, "background-color, color"),
    minWidth: state.type === "literal" ? undefined : "1ch",
    paddingInline: state.type === "literal" ? 0 : 1,
    borderRadius: metrics.radius,
    outline: "none",
    background: selected ?? "transparent",
    color: selected === null ? "inherit" : readableColor(selected, colors),
    opacity: state.isPlaceholder ? controlOpacity.placeholder : 1,
    fontVariantNumeric: "tabular-nums",
    textAlign: "center"
  } as const
}
