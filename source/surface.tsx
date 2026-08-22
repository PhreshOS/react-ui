import { forwardRef } from "react"
import type { ComponentPropsWithoutRef } from "react"
import {
  isScaleLevel,
  scale,
  themeLimits,
  type ColorLevel,
  type ScaleLevel,
  type ThemeRange
} from "@phreshos/core"
import { useTheme } from "./theme-provider.js"

/** A Theme-derived treatment or direct CSS color. */
export type SurfaceColor = ColorLevel | (string & {})

/** Properties retained by the div-only Surface diagnostic contract. */
export type SurfaceProps = Omit<ComponentPropsWithoutRef<"div">, "color" | "opacity"> & Readonly<{
  /** Accepted but ignored while canvas paint is disabled. */
  color?: SurfaceColor

  /** Accepted but ignored while canvas paint is disabled. */
  grain?: ScaleLevel | number

  /** Accepted but ignored while canvas paint is disabled. */
  animation?: ScaleLevel | number

  /** Theme-derived level or direct backdrop blur from zero to 24 CSS pixels. */
  backdrop?: ScaleLevel | number

  /** Accepted but ignored while canvas paint is disabled. */
  opacity?: ScaleLevel | number
}>

/**
 * Temporary div-only Surface used to isolate canvas effects.
 */
export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(function Surface(
  { animation, backdrop, color, grain, opacity, style, ...properties },
  ref
) {
  const theme = useTheme()
  const surfaceBackdrop = theme.surface?.backdrop ?? legacyBackdrop
  const backdropLimit = themeLimits.surface?.backdrop ?? legacyBackdropLimit
  const resolvedBackdrop = resolveScale(backdrop, surfaceBackdrop, backdropLimit)
  const blur = resolvedBackdrop === 0 ? {} : {
    backdropFilter: `blur(${resolvedBackdrop}px)`,
    WebkitBackdropFilter: `blur(${resolvedBackdrop}px)`
  }

  void animation
  void color
  void grain
  void opacity

  return <div
    {...properties}
    ref={ref}
    style={{
      borderRadius: theme.radius,
      color: theme.foreground,
      ...blur,
      ...style
    }}
  />
})

function resolveScale(value: ScaleLevel | number | undefined, base: number, range: ThemeRange) {
  const resolved = isScaleLevel(value) ? scale(base, value) : value ?? base
  const finite = Number.isFinite(resolved) ? resolved : base
  return Math.min(range.maximum, Math.max(range.minimum, finite))
}

const legacyBackdrop = 0
const legacyBackdropLimit = Object.freeze({ minimum: 0, maximum: 24 })
