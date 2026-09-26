import type { CSSProperties, ReactNode } from "react"
import { FieldError, Label, Text } from "react-aria-components"
import { colorOpacity, mixColor } from "../foundation/color.js"
import { controlFontWeight, controlOpacity, type ControlMetrics } from "./control.js"

/**
 * The root of every value-holding component. It is the only element that
 * applies the control text scale; every part inherits from it.
 */
export function fieldStyle(metrics: ControlMetrics, style?: CSSProperties): CSSProperties {
  return {
    display: "grid",
    alignContent: "start",
    gap: metrics.gap,
    minWidth: 0,
    fontFamily: "inherit",
    fontSize: metrics.fontSize,
    lineHeight: 1.45,
    ...style
  }
}

export function FieldLabel({ label }: Readonly<{ label?: ReactNode }>) {
  return label == null ? null : <Label style={{ fontWeight: controlFontWeight }}>{label}</Label>
}

/** Description and validation text shared by every field. */
export function FieldFeedback({ description, errorMessage, metrics }: Readonly<{
  description?: ReactNode
  errorMessage?: ReactNode
  metrics: ControlMetrics
}>) {
  const { colors } = metrics.visual
  return <>
    {description != null && <Text slot="description" style={{ fontSize: "0.92em", opacity: controlOpacity.secondary }}>{description}</Text>}
    <FieldError style={{ fontSize: "0.92em", color: mixColor(colors.danger, colors.foreground, 0.15) }}>{errorMessage}</FieldError>
  </>
}

/** How strongly every separator shows its text color. */
export const separatorOpacity = 0.1

/** Separator paint shared by menus, tables, layouts, and toolbars. */
export function separatorColor(metrics: ControlMetrics) {
  return colorOpacity(metrics.visual.colors.foreground, separatorOpacity)
}
