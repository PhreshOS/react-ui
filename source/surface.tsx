import { forwardRef, useCallback, useId, useLayoutEffect, useRef } from "react"
import type { ComponentPropsWithoutRef } from "react"
import {
  color as deriveColor,
  isScaleLevel,
  scale,
  scaleMultiplier,
  themeLimits,
  type ColorLevel,
  type ScaleLevel,
  type ThemeRange
} from "@phreshos/core"
import { SurfaceMaterial } from "./surface-material.js"
import { useTheme } from "./theme-provider.js"

/** A Theme-derived treatment or direct CSS color. */
export type SurfaceColor = ColorLevel | (string & {})

/** Native div properties plus controls for the locally owned material. */
export type SurfaceProps = Omit<ComponentPropsWithoutRef<"div">, "color" | "opacity"> & Readonly<{
  /** Theme-derived treatment or direct CSS material color. */
  color?: SurfaceColor

  /** Theme-derived level or direct grain intensity from zero to one. */
  grain?: ScaleLevel | number

  /** Theme-derived level or direct retained grain amount from zero to one. */
  grainAmount?: ScaleLevel | number

  /** Theme-derived level or direct grain changes per second from zero to 16. */
  animation?: ScaleLevel | number

  /** Theme-derived level or direct backdrop blur from zero to 24 CSS pixels. */
  backdrop?: ScaleLevel | number

  /** Theme-derived level or direct material opacity from zero to one. */
  opacity?: ScaleLevel | number

  /** Theme-derived level or direct organic displacement from zero to 140 pixels. */
  distortion?: ScaleLevel | number

  /** Theme-derived level or direct directional displacement from zero to 40 pixels. */
  waves?: ScaleLevel | number

  /** Theme-derived level or direct ripple displacement from zero to 40 pixels. */
  ripples?: ScaleLevel | number

  /** Theme-derived level or direct backdrop saturation multiplier. */
  saturation?: ScaleLevel | number

  /** Theme-derived level or direct backdrop brightness multiplier. */
  brightness?: ScaleLevel | number
}>

/** Contains content above one independent pure-SVG Surface material. */
export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(function Surface(
  { animation, backdrop, brightness, children, color, distortion, grain, grainAmount, opacity, ripples, saturation, style, waves, ...properties },
  forwardedRef
) {
  const theme = useTheme()
  const identity = `phresh-surface-${useId().replaceAll(":", "")}`
  const element = useRef<HTMLDivElement | null>(null)
  const ref = useCallback((node: HTMLDivElement | null) => {
    element.current = node
    if (typeof forwardedRef === "function") forwardedRef(node)
    else if (forwardedRef) forwardedRef.current = node
  }, [forwardedRef])
  const resolvedColor = resolveColor(color, theme.background)
  const resolvedGrain = resolveScale(grain, theme.surface.grain, themeLimits.surface.grain)
  const resolvedGrainAmount = resolveScale(grainAmount, theme.surface.grainAmount, themeLimits.surface.grainAmount)
  const resolvedAnimation = resolveScale(animation, theme.surface.animation, themeLimits.surface.animation)
  const resolvedBackdrop = resolveScale(backdrop, theme.surface.backdrop, themeLimits.surface.backdrop)
  const resolvedOpacity = resolveScale(opacity, theme.surface.opacity, themeLimits.surface.opacity)
  const resolvedDistortion = resolveScale(distortion, theme.surface.distortion, themeLimits.surface.distortion)
  const resolvedWaves = resolveScale(waves, theme.surface.waves, themeLimits.surface.waves)
  const resolvedRipples = resolveScale(ripples, theme.surface.ripples, themeLimits.surface.ripples)
  const resolvedSaturation = resolveMultiplier(saturation, theme.surface.saturation, themeLimits.surface.saturation)
  const resolvedBrightness = resolveMultiplier(brightness, theme.surface.brightness, themeLimits.surface.brightness)
  const hasDistortion = resolvedDistortion > 0 || resolvedWaves > 0 || resolvedRipples > 0
  const nativeFilters = [
    resolvedBackdrop === 0 ? "" : `blur(${resolvedBackdrop}px)`,
    resolvedSaturation === 1 ? "" : `saturate(${resolvedSaturation})`,
    resolvedBrightness === 1 ? "" : `brightness(${resolvedBrightness})`
  ].filter(Boolean)
  const filters = [hasDistortion ? `url("#${identity}-distortion")` : "", ...nativeFilters].filter(Boolean)
  const backdropStyle = filters.length === 0 ? {} : {
    backdropFilter: filters.join(" "),
    ...(nativeFilters.length === 0 ? {} : { WebkitBackdropFilter: nativeFilters.join(" ") })
  }

  useLayoutEffect(() => {
    const surface = element.current
    if (surface) return prepareSurfaceLayout(surface)
  })

  return <div
    {...properties}
    ref={ref}
    style={{
      borderRadius: theme.radius,
      color: theme.foreground,
      ...backdropStyle,
      ...style
    }}
  >
    <SurfaceMaterial
      animation={resolvedAnimation}
      color={resolvedColor}
      distortion={resolvedDistortion}
      grain={resolvedGrain}
      grainAmount={resolvedGrainAmount}
      identity={identity}
      opacity={resolvedOpacity}
      ripples={resolvedRipples}
      waves={resolvedWaves}
    />
    {children}
  </div>
})

function resolveColor(value: SurfaceColor | undefined, base: string) {
  if (value === undefined) return base
  return isColorLevel(value) ? deriveColor(base)[value] : value
}

function isColorLevel(value: SurfaceColor): value is ColorLevel {
  return value === "subtle" || value === "soft" || value === "base" || value === "strong" || value === "intense"
}

function resolveScale(value: ScaleLevel | number | undefined, base: number, range: ThemeRange) {
  const resolved = isScaleLevel(value) ? scale(base, value) : value ?? base
  const finite = Number.isFinite(resolved) ? resolved : base
  return Math.min(range.maximum, Math.max(range.minimum, finite))
}

function resolveMultiplier(value: ScaleLevel | number | undefined, base: number, range: ThemeRange) {
  const resolved = isScaleLevel(value) ? scaleMultiplier(base, value) : value ?? base
  const finite = Number.isFinite(resolved) ? resolved : base
  return Math.min(range.maximum, Math.max(range.minimum, finite))
}

function prepareSurfaceLayout(element: HTMLElement) {
  const view = element.ownerDocument.defaultView
  const computed = view?.getComputedStyle(element)
  const position = element.style.position
  const isolation = element.style.isolation
  const ownsPosition = computed?.position === "static"
  const ownsIsolation = computed?.isolation !== "isolate"

  if (ownsPosition) element.style.position = "relative"
  if (ownsIsolation) element.style.isolation = "isolate"

  return () => {
    if (ownsPosition && element.style.position === "relative") element.style.position = position
    if (ownsIsolation && element.style.isolation === "isolate") element.style.isolation = isolation
  }
}
