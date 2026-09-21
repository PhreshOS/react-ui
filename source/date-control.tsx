import { useState } from "react"
import type { CSSProperties, FocusEvent, FocusEventHandler, ReactNode } from "react"
import { DateInput, DateSegment, Group } from "react-aria-components"
import type { DateSegmentRenderProps } from "react-aria-components"
import {
  controlOpacity,
  controlPaint,
  controlStyle,
  type ControlTheme
} from "./control.js"
import type { MaterialOverrides } from "./material-options.js"
import type { ShadowOverrides } from "./shadow-options.js"
import { Surface } from "./surface.js"

/** Shared visual and segmented-input boundary for date and time controls. */
export function DateControl({
  active = false,
  children,
  disabled,
  end,
  endFocusVisible,
  endRequiresVisibleFocus = false,
  group = false,
  invalid,
  material,
  shadow,
  theme
}: Readonly<{
  active?: boolean
  children?: ReactNode
  disabled: boolean
  end?: ReactNode
  endFocusVisible?: boolean
  endRequiresVisibleFocus?: boolean
  group?: boolean
  invalid: boolean
  material: MaterialOverrides["material"]
  shadow: ShadowOverrides["shadow"]
  theme: ControlTheme
}>) {
  const [focused, setFocused] = useState(false)
  const [endFocused, setEndFocused] = useState(false)
  const [hovered, setHovered] = useState(false)
  // Popovers restore trigger focus after pointer dismissal; only keyboard-visible
  // focus on that end control should reactivate the field paint.
  const engaged = active || (focused && (!endFocused || !endRequiresVisibleFocus || endFocusVisible === true))
  const paint = controlPaint(theme, engaged, invalid, hovered)
  const style = controlStyle(theme, engaged, invalid, hovered, focused)

  const onBlurCapture: FocusEventHandler<HTMLDivElement> = event => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setFocused(false)
      setEndFocused(false)
    }
  }
  const surface = {
    color: paint.background,
    material,
    shadow,
    radius: theme.radius,
    onFocusCapture: (event: FocusEvent<HTMLDivElement>) => {
      setFocused(true)
      setEndFocused(event.target instanceof Element && event.target.closest("[data-date-control-end]") != null)
    },
    onBlurCapture,
    onPointerEnter: () => setHovered(true),
    onPointerLeave: () => setHovered(false),
    style: {
      ...style,
      display: "flex",
      alignItems: "center",
      cursor: disabled ? "not-allowed" : "text"
    } satisfies CSSProperties
  }
  const content = <>
    {children ?? <DateSegments theme={theme} />}
    {end}
  </>

  return group
    ? <Surface as={Group} {...surface}>{content}</Surface>
    : <Surface {...surface}>{content}</Surface>
}

/** Segmented input used once for a date and twice for a date range. */
export function DateSegments({ compact = false, slot, theme }: Readonly<{
  compact?: boolean
  slot?: "start" | "end"
  theme: ControlTheme
}>) {
  return <DateInput slot={slot} style={{
    display: "flex",
    alignItems: "center",
    flex: compact ? "0 1 auto" : "1 1 auto",
    minWidth: 0
  }}>
    {segment => <DateSegment segment={segment} style={segmentState => segmentStyle(theme, segmentState)} />}
  </DateInput>
}

function segmentStyle(theme: ControlTheme, state: DateSegmentRenderProps): CSSProperties {
  const selected = state.isFocused ? theme.paints.subtle.pressed : null

  return {
    ...theme.transition,
    minWidth: state.type === "literal" ? undefined : "1ch",
    paddingInline: state.type === "literal" ? 0 : 1,
    borderRadius: Math.max(2, theme.spacing / 3),
    outline: "none",
    background: selected?.background ?? "transparent",
    color: selected?.color ?? "inherit",
    opacity: state.isPlaceholder ? controlOpacity.placeholder : 1,
    fontVariantNumeric: "tabular-nums",
    textAlign: "center"
  }
}
