import { useContext, type CSSProperties } from "react"
import { isSameDay } from "@internationalized/date"
import {
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  CalendarHeading,
  CalendarStateContext,
  RangeCalendarStateContext
} from "react-aria-components"
import type { CalendarCellRenderProps, CalendarState, RangeCalendarState } from "react-aria-components"
import { Button } from "./button.js"
import { controlFontWeight, controlOpacity, transition, type ControlMetrics } from "./control/control.js"
import { selectionLevel } from "./control/item.js"
import { colorLevel, colorOpacity, readableColor, resolveColor, type Color } from "./foundation/color.js"
import { useDirection } from "./foundation/direction.js"
import type { ScaleLevel } from "./foundation/scale.js"
import { dimmedClass, surfacePaint } from "./surface/surface.js"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { iconProps } from "./control/icon.js"

/** Shared month layout used by both single-date and range calendar roots. */
export function CalendarLayout({ color, metrics, range = false, size }: Readonly<{
  color: Color
  metrics: ControlMetrics
  range?: boolean
  size?: ScaleLevel
}>) {
  const direction = useDirection()
  const cell = metrics.height
  const single = useContext(CalendarStateContext)
  const ranged = useContext(RangeCalendarStateContext)

  return <>
    <header style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: metrics.gap }}>
      <Button slot="previous" size={size} aria-label="Previous month" style={{ width: metrics.height, paddingInline: 0 }}>
        <Chevron direction={direction === "rtl" ? "next" : "previous"} />
      </Button>
      <CalendarHeading style={{ margin: 0, textAlign: "center", fontFamily: "inherit", fontSize: "inherit", fontStyle: "inherit", lineHeight: "inherit", fontWeight: controlFontWeight }} />
      <Button slot="next" size={size} aria-label="Next month" style={{ width: metrics.height, paddingInline: 0 }}>
        <Chevron direction={direction === "rtl" ? "previous" : "next"} />
      </Button>
    </header>
    <CalendarGrid style={{ width: "max-content", margin: 0, borderCollapse: "separate", borderSpacing: 2, background: "transparent" }}>
      <CalendarGridHeader>
        {day => <CalendarHeaderCell style={{ height: cell * 0.72, padding: 0, textAlign: "center", fontFamily: "inherit", fontSize: "inherit", fontStyle: "inherit", lineHeight: "inherit", fontWeight: controlFontWeight, opacity: controlOpacity.secondary }}>
          {day}
        </CalendarHeaderCell>}
      </CalendarGridHeader>
      <CalendarGridBody>
        {date => <CalendarCell date={date} className={state => dimmedClass(state.isDisabled || state.isUnavailable, state.defaultClassName) ?? ""} style={state => cellStyle(metrics, color, state, daySelection(state, ranged ?? single), range)} />}
      </CalendarGridBody>
    </CalendarGrid>
  </>
}

export function calendarRootStyle(metrics: ControlMetrics, style?: CSSProperties): CSSProperties {
  return {
    ...style,
    display: "grid",
    width: "max-content",
    maxWidth: "100%",
    gap: metrics.gap,
    padding: metrics.spacing,
    fontFamily: "inherit",
    fontSize: metrics.fontSize,
    lineHeight: 1.45
  }
}

type DaySelection = Readonly<{ selected: boolean, start: boolean, end: boolean }>

/**
 * Whether a day shows as chosen. React Aria reports no chosen day while the
 * whole calendar is disabled, but a disabled calendar still holds its value,
 * so the value is shown from the calendar state itself.
 */
function daySelection(state: CalendarCellRenderProps, calendar: CalendarState<"single" | "multiple"> | RangeCalendarState | null): DaySelection {
  if (calendar == null || !calendar.isDisabled) return { selected: state.isSelected, start: state.isSelectionStart, end: state.isSelectionEnd }
  const shown = !state.isUnavailable && !calendar.isInvalid(state.date)
  if ("highlightedRange" in calendar) {
    const range = calendar.highlightedRange
    const selected = shown && range != null && state.date.compare(range.start) >= 0 && state.date.compare(range.end) <= 0
    return { selected, start: selected && isSameDay(state.date, range!.start), end: selected && isSameDay(state.date, range!.end) }
  }
  const values = [calendar.value].flat()
  const selected = shown && values.some(value => value != null && isSameDay(state.date, value))
  return { selected, start: selected, end: selected }
}

/**
 * A chosen day is the calendar's one decision, so it takes the full color;
 * the days inside a range take the selection level; every other day only veils.
 */
function cellStyle(metrics: ControlMetrics, color: Color, state: CalendarCellRenderProps, selection: DaySelection, range: boolean): CSSProperties {
  const { visual } = metrics
  const { colors } = visual
  const base = resolveColor(color, colors)
  const endpoint = selection.selected && (!range || selection.start || selection.end)
  const fill = endpoint
    ? base
    : selection.selected
      ? colorLevel(base, selectionLevel, colors)
      : "transparent"
  const paint = surfacePaint(visual, fill, "flat", "none", false, {
    hovered: state.isHovered || state.isFocused,
    pressed: state.isPressed,
    disabled: state.isDisabled || state.isUnavailable
  })

  return {
    ...transition(visual, "background-color, color, outline-color"),
    display: "grid",
    placeItems: "center",
    boxSizing: "border-box",
    width: metrics.height,
    height: metrics.height,
    borderRadius: metrics.radius,
    outline: `3px solid ${state.isFocusVisible ? colorOpacity(colors.primary, 0.34) : "transparent"}`,
    outlineOffset: 1,
    background: paint.fill,
    color: endpoint ? readableColor(base, colors) : "inherit",
    fontWeight: state.isToday ? controlFontWeight : undefined,
    opacity: state.isOutsideMonth ? controlOpacity.secondary : undefined,
    textDecoration: state.isUnavailable ? "line-through" : "none",
    cursor: state.isDisabled || state.isUnavailable ? "not-allowed" : "pointer",
    fontVariantNumeric: "tabular-nums"
  }
}

function Chevron({ direction }: Readonly<{ direction: "previous" | "next" }>) {
  return direction === "previous" ? <ChevronLeft {...iconProps(14)} /> : <ChevronRight {...iconProps(14)} />
}
