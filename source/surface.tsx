import { forwardRef, useCallback, useLayoutEffect, useRef } from "react"
import type { ComponentPropsWithoutRef } from "react"
import {
  color as deriveColor,
  isScaleLevel,
  scale,
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

  /** Theme-derived level or direct grain changes per second from zero to 16. */
  animation?: ScaleLevel | number

  /** Theme-derived level or direct backdrop blur from zero to 24 CSS pixels. */
  backdrop?: ScaleLevel | number

  /** Theme-derived level or direct material opacity from zero to one. */
  opacity?: ScaleLevel | number
}>

/** Contains content above one independent pure-SVG Surface material. */
export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(function Surface(
  { animation, backdrop, children, color, grain, opacity, style, ...properties },
  forwardedRef
) {
  const theme = useTheme()
  const element = useRef<HTMLDivElement | null>(null)
  const ref = useCallback((node: HTMLDivElement | null) => {
    element.current = node
    if (typeof forwardedRef === "function") forwardedRef(node)
    else if (forwardedRef) forwardedRef.current = node
  }, [forwardedRef])
  const resolvedColor = resolveColor(color, theme.background)
  const resolvedGrain = resolveScale(grain, theme.surface.grain, themeLimits.surface.grain)
  const resolvedAnimation = resolveScale(animation, theme.surface.animation, themeLimits.surface.animation)
  const resolvedBackdrop = resolveScale(backdrop, theme.surface.backdrop, themeLimits.surface.backdrop)
  const resolvedOpacity = resolveScale(opacity, theme.surface.opacity, themeLimits.surface.opacity)
  const blur = resolvedBackdrop === 0 ? {} : {
    backdropFilter: `blur(${resolvedBackdrop}px)`,
    WebkitBackdropFilter: `blur(${resolvedBackdrop}px)`
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
      ...blur,
      ...style
    }}
  >
    <SurfaceMaterial
      animation={resolvedAnimation}
      color={resolvedColor}
      grain={resolvedGrain}
      opacity={resolvedOpacity}
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
