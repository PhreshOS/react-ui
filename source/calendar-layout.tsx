import type { CSSProperties } from "react"
import {
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  CalendarHeading
} from "react-aria-components"
import type { CalendarCellRenderProps } from "react-aria-components"
import { Button } from "./button.js"
import { resolveColorLevel, solidColors } from "./color.js"
import {
  controlFontWeight,
  controlOpacity,
  type ControlProps,
  type ControlTheme
} from "./control.js"
import { useDirection } from "./direction.js"

/** Shared month layout used by both single-date and range calendar roots. */
export function CalendarLayout({ color, range = false, size, theme }: Pick<ControlProps, "color" | "size"> & Readonly<{
  range?: boolean
  theme: ControlTheme
}>) {
  const direction = useDirection()

  return <>
    <header style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: theme.gap }}>
      <Button slot="previous" color={color} size={size} aria-label="Previous month" style={navigationStyle(theme)}>
        <Chevron direction={direction === "rtl" ? "next" : "previous"} />
      </Button>
      <CalendarHeading style={{
        margin: 0,
        textAlign: "center",
        fontFamily: "inherit",
        fontSize: "inherit",
        fontStyle: "inherit",
        lineHeight: "inherit",
        fontWeight: controlFontWeight
      }} />
      <Button slot="next" color={color} size={size} aria-label="Next month" style={navigationStyle(theme)}>
        <Chevron direction={direction === "rtl" ? "previous" : "next"} />
      </Button>
    </header>
    <CalendarGrid style={{
      width: "max-content",
      margin: 0,
      tableLayout: "fixed",
      border: 0,
      borderRadius: 0,
      borderCollapse: "separate",
      borderSpacing: Math.max(1, theme.gap / 4),
      background: "transparent"
    }}>
      <CalendarGridHeader>
        {day => <CalendarHeaderCell style={{
          height: theme.height * 0.72,
          padding: 0,
          border: 0,
          background: "transparent",
          textAlign: "center",
          fontFamily: "inherit",
          fontSize: "inherit",
          fontStyle: "inherit",
          lineHeight: "inherit",
          fontWeight: controlFontWeight,
          opacity: controlOpacity.secondary
        }}>
          {day}
        </CalendarHeaderCell>}
      </CalendarGridHeader>
      <CalendarGridBody>
        {date => <CalendarCell date={date} style={state => calendarCellStyle(theme, state, range)} />}
      </CalendarGridBody>
    </CalendarGrid>
  </>
}

export function calendarRootStyle(theme: ControlTheme, disabled = false, style?: CSSProperties): CSSProperties {
  return {
    ...style,
    display: "grid",
    width: "max-content",
    maxWidth: "100%",
    gap: theme.gap,
    padding: theme.spacing,
    fontFamily: "inherit",
    fontSize: theme.fontSize,
    lineHeight: 1.5,
    opacity: disabled ? controlOpacity.disabled : 1
  }
}

function navigationStyle(theme: ControlTheme): CSSProperties {
  return {
    width: theme.height,
    paddingInline: 0
  }
}

function calendarCellStyle(theme: ControlTheme, state: CalendarCellRenderProps, range: boolean): CSSProperties {
  const rangeInterior = range && state.isSelected && !state.isSelectionStart && !state.isSelectionEnd
    ? rangeInteriorPaint(theme)
    : null
  const paint = state.isSelected
    ? rangeInterior ?? theme.paints.palette.pressed
    : state.isPressed
      ? theme.paints.subtle.pressed
      : state.isHovered || state.isFocused
        ? theme.paints.subtle.hover
        : null

  return {
    ...theme.transition,
    display: "grid",
    placeItems: "center",
    boxSizing: "border-box",
    width: theme.height,
    height: theme.height,
    borderRadius: theme.radius,
    outline: state.isFocusVisible ? `1px solid ${theme.focusColor}` : "none",
    outlineOffset: -1,
    background: paint?.background ?? "transparent",
    color: paint?.color ?? "inherit",
    opacity: state.isDisabled || state.isUnavailable
      ? controlOpacity.disabled
      : state.isOutsideMonth ? controlOpacity.secondary : 1,
    textDecoration: state.isUnavailable ? "line-through" : "none",
    cursor: state.isDisabled || state.isUnavailable ? "not-allowed" : "pointer",
    fontVariantNumeric: "tabular-nums"
  }
}

function rangeInteriorPaint(theme: ControlTheme) {
  // Range interiors are the same Appearance color at its defined lighter
  // treatment; endpoints retain the stronger selected control paint.
  const background = resolveColorLevel(theme.tint, "soft")
  return {
    background,
    color: solidColors(background, theme.background, theme.foreground).rest.color
  }
}

function Chevron({ direction }: Readonly<{ direction: "previous" | "next" }>) {
  return <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d={direction === "previous" ? "m7.5 2-4 4 4 4" : "m4.5 2 4 4-4 4"} />
  </svg>
}
