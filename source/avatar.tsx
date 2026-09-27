import { forwardRef } from "react"
import type { CSSProperties, ReactNode } from "react"
import { controlFontWeight, useControlMetrics } from "./control/control.js"
import type { AppearanceColor } from "./foundation/appearance.js"
import { colorLevel, resolveColor, type Color } from "./foundation/color.js"
import type { ScaleLevel } from "./foundation/scale.js"
import { Surface } from "./surface/surface.js"

export interface AvatarProps {
  /** Who it shows. It names the Avatar for assistive technology and supplies the initials. */
  readonly name: string
  /** A picture that replaces the initials. */
  readonly src?: string
  /** Replaces the initials, for example with an icon for an agent. */
  readonly children?: ReactNode
  /** Otherwise one of the Appearance roles, chosen from the name so a person keeps one color. */
  readonly color?: Color
  /** The Avatar is as tall as a control of this size. */
  readonly size?: ScaleLevel
  readonly className?: string
  readonly style?: CSSProperties
}

const roles: readonly AppearanceColor[] = ["primary", "secondary", "success", "warning", "info", "danger"]

/** The same name always lands on the same role. */
function nameRole(name: string): AppearanceColor {
  let hash = 0
  for (const character of name) hash = (hash * 31 + character.codePointAt(0)!) >>> 0
  return roles[hash % roles.length]!
}

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return words.slice(0, 2).map(word => [...word][0]!.toLocaleUpperCase()).join("")
}

/**
 * A person or an agent, drawn as a circle as tall as a control: a picture, or
 * initials on the soft level of a color. The text color follows from the
 * paint like any Surface.
 */
export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(function Avatar({ name, src, children, color, size, className, style }, ref) {
  const metrics = useControlMetrics(size)
  const { colors } = metrics.visual
  const fill = colorLevel(resolveColor(color ?? nameRole(name), colors), "soft", colors)

  return <Surface as="span" ref={ref} role="img" aria-label={name} className={className} color={fill} depth="flat" radius="full" style={{
    display: "inline-grid",
    placeItems: "center",
    flexShrink: 0,
    width: metrics.height,
    height: metrics.height,
    overflow: "hidden",
    fontSize: metrics.fontSize,
    fontWeight: controlFontWeight,
    lineHeight: 1,
    userSelect: "none",
    ...style
  }}>
    {src !== undefined
      ? <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} />
      : children ?? initials(name)}
  </Surface>
})
