import { forwardRef } from "react"
import type { CSSProperties, ReactNode } from "react"
import { controlFontSizes, controlFontWeight, useControlMetrics } from "./control/control.js"
import { colorLevel, resolveColor, type Color } from "./foundation/color.js"
import type { ScaleLevel } from "./foundation/scale.js"
import { Surface } from "./surface/surface.js"

export interface BadgeProps {
  readonly children?: ReactNode
  /** The color role of the state it names. Omitted, the Badge is neutral: the content color. */
  readonly color?: Color
  /** Leads with a dot in the full color, for a live state such as `running`. */
  readonly dot?: boolean
  /** The badge sizes its text one control step below this level. */
  readonly size?: ScaleLevel
  readonly className?: string
  readonly style?: CSSProperties
}

const smaller: Readonly<Record<ScaleLevel, ScaleLevel>> = Object.freeze({ xsmall: "xsmall", small: "xsmall", medium: "small", large: "medium", xlarge: "large" })

/**
 * A short label for a state, such as `running` or `stopped`. It is not a
 * control: it is painted in the subtle level of its color, like a selection,
 * with its text in the strong level so the color stays readable.
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge({ children, color = "foreground", dot = false, size, className, style }, ref) {
  const metrics = useControlMetrics(size)
  const { colors } = metrics.visual
  const base = resolveColor(color, colors)
  const fill = colorLevel(base, "subtle", colors)

  return <Surface as="span" ref={ref} className={className} color={fill} depth="flat" radius="full" style={{
    display: "inline-flex",
    alignItems: "center",
    gap: metrics.gap / 2,
    paddingInline: metrics.gap,
    paddingBlock: metrics.gap / 4,
    color: colorLevel(base, "strong", colors),
    fontSize: controlFontSizes[smaller[size ?? "medium"]],
    fontWeight: controlFontWeight,
    lineHeight: 1.45,
    whiteSpace: "nowrap",
    verticalAlign: "middle",
    ...style
  }}>
    {dot && <span aria-hidden="true" style={{ width: "0.5em", height: "0.5em", borderRadius: "50%", background: base, flexShrink: 0 }} />}
    {children}
  </Surface>
})
