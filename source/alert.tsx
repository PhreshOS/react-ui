import { forwardRef } from "react"
import type { ReactNode } from "react"
import { controlFontSizes, controlFontWeight, useControlMetrics } from "./control/control.js"
import { iconProps } from "./control/icon.js"
import { meaningIcon, urgentMeaning } from "./control/meaning.js"
import { colorLevel, resolveColor, type Color } from "./foundation/color.js"
import { resolveRadius } from "./foundation/radius.js"
import { Surface, type SurfaceProps } from "./surface/surface.js"
import { containerPadding } from "./foundation/spacing.js"

export interface AlertProps extends Omit<SurfaceProps, "color" | "title" | "children"> {
  /** The meaning, as a color role: `info` by default; `warning` and `danger` also interrupt. */
  readonly color?: Color
  readonly title?: ReactNode
  /** Replaces the icon of the color's meaning; `false` leaves the Alert without one. */
  readonly icon?: ReactNode | false
  readonly children?: ReactNode
}

/**
 * A message that stays in place, such as a failed save. It is painted in the
 * subtle level of its color, like a selection, and leads with the icon of its
 * meaning. Warnings and dangers are announced as they appear.
 */
export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert({
  color = "info", title, icon, children, radius, style, ...properties
}, ref) {
  const metrics = useControlMetrics()
  const { colors } = metrics.visual
  const urgent = urgentMeaning(color)
  const MeaningIcon = meaningIcon(color)

  return <Surface
    {...properties}
    ref={ref}
    role={urgent ? "alert" : "status"}
    color={colorLevel(resolveColor(color, colors), "subtle", colors)}
    depth="flat"
    radius={radius ?? resolveRadius("medium", metrics.visual.radius)}
    style={{
      display: "grid",
      gridTemplateColumns: icon === false ? "minmax(0, 1fr)" : "auto minmax(0, 1fr)",
      alignItems: "start",
      gap: metrics.gap * 2,
      padding: containerPadding(metrics.visual.spacing),
      fontSize: controlFontSizes.medium,
      lineHeight: 1.45,
      ...style
    }}
  >
    {icon !== false && <span style={{ display: "grid", height: "1.45em", alignItems: "center" }}>{icon ?? <MeaningIcon {...iconProps(16)} />}</span>}
    <div style={{ display: "grid", gap: 2, minWidth: 0 }}>
      {title != null && <strong style={{ fontWeight: controlFontWeight }}>{title}</strong>}
      {children != null && <div>{children}</div>}
    </div>
  </Surface>
})
