import type { CSSProperties, ReactNode } from "react"
import type { Color } from "../foundation/color.js"
import { resolveRadius, type Radius } from "../foundation/radius.js"
import { isScaleLevel } from "../foundation/scale.js"
import { scale, type ScaleLevel } from "../foundation/scale.js"
import { useVisual, type Visual } from "../foundation/visual.js"

/** Properties shared by every component that owns a paint. */
export interface ControlProps {
  /** Base paint. Every interaction state is derived from it. */
  readonly color?: Color
  /** Scale of the whole control, relative to Appearance spacing and inherited text. */
  readonly size?: ScaleLevel
  readonly className?: string
  readonly style?: CSSProperties
  /** Prevents focus and activation. */
  readonly disabled?: boolean
}

/** Properties shared by every component that holds a value. */
export interface FieldProps {
  /** Visible accessible label. Otherwise supply aria-label or aria-labelledby. */
  readonly label?: ReactNode
  readonly description?: ReactNode
  readonly errorMessage?: ReactNode
  readonly required?: boolean
  readonly invalid?: boolean
}

/** Names owned by our contract, never exposed again under their React Aria spelling. */
export type ControlOverrides = keyof ControlProps | keyof FieldProps | "children" | "isDisabled" | "isRequired" | "isInvalid" | "isReadOnly"

/** Relative text scale for control content. Only a component's root applies it. */
export const controlFontSizes: Readonly<Record<ScaleLevel, string>> = Object.freeze({
  xsmall: "0.6875em",
  small: "0.75em",
  medium: "0.8125em",
  large: "0.875em",
  xlarge: "0.9375em"
})

export const controlFontWeight = 600

/** Attenuation shared by every control family. */
export const controlOpacity = Object.freeze({
  pending: 0.68,
  secondary: 0.66,
  placeholder: 0.55
})

/** Geometry of one control size, derived from Appearance spacing and radius. */
export interface ControlMetrics {
  readonly visual: Visual
  readonly spacing: number
  readonly height: number
  readonly inset: number
  readonly gap: number
  readonly indicator: number
  /** Space between a collection's edge and its Items. */
  readonly listInset: number
  readonly radius: CSSProperties["borderRadius"]
  readonly fontSize: string
}

const metrics = new WeakMap<Visual, Map<string, ControlMetrics>>()

/** Returns the shared metrics for one size and radius in the active Appearance. */
export function useControlMetrics(size: ScaleLevel = "medium", radius: Radius = "medium"): ControlMetrics {
  return controlMetrics(useVisual(), size, radius)
}

export function controlMetrics(visual: Visual, size: ScaleLevel, radius: Radius): ControlMetrics {
  let cache = metrics.get(visual)
  if (cache === undefined) metrics.set(visual, cache = new Map())
  const key = `${size}:${radius}`
  const cached = cache.get(key)
  if (cached !== undefined) return cached

  const spacing = scale(visual.spacing, size)
  const height = controlHeight(spacing)
  const result: ControlMetrics = Object.freeze({
    visual,
    spacing,
    height,
    // Side padding follows the size, never below half the Appearance spacing,
    // so a compact icon-only control stays close to square.
    inset: Math.max(visual.spacing / 2, spacing),
    gap: Math.max(4, spacing / 2),
    indicator: Math.round(14 + spacing / 3),
    listInset: Math.max(4, spacing / 3),
    radius: isScaleLevel(radius) ? proportionalRadius(visual, height, radius) : resolveRadius(radius, visual.radius),
    fontSize: controlFontSizes[size]
  })
  cache.set(key, result)
  return result
}

/** The height of a control whose size level resolves to this spacing. */
function controlHeight(spacing: number): number {
  return Math.round(22 + spacing)
}

/**
 * An Appearance radius level scaled to one control height, so a control keeps
 * the same shape at every size: the medium control height carries the
 * Appearance radius itself.
 */
export function proportionalRadius(visual: Visual, height: number, level: ScaleLevel = "medium"): number {
  const medium = controlHeight(visual.spacing)
  return Math.round(scale(visual.radius, level) * height / medium * 100) / 100
}

/** A CSS transition for the given properties using the Appearance transaction. */
export function transition(visual: Visual, properties: string, factor = 1): CSSProperties {
  return {
    transitionProperty: properties,
    transitionDuration: `${visual.duration * factor}ms`,
    transitionTimingFunction: visual.easing
  }
}
