import { forwardRef, useCallback, useId, useLayoutEffect, useRef } from "react"
import type { ComponentPropsWithoutRef, CSSProperties } from "react"
import {
  color as deriveColor,
  isScaleLevel,
  scale,
  scaleMultiplier,
  themeLimits,
  type ColorLevel,
  type ScaleLevel,
  type ThemeProperties,
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

type SurfaceControls = Pick<SurfaceProps,
  "animation" |
  "backdrop" |
  "brightness" |
  "color" |
  "distortion" |
  "grain" |
  "grainAmount" |
  "opacity" |
  "ripples" |
  "saturation" |
  "waves"
>

const layerStyle = {
  position: "absolute",
  inset: 0,
  borderRadius: "inherit",
  pointerEvents: "none"
} satisfies CSSProperties

/** Contains content above locally owned Surface material layers. */
export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(function Surface(
  { animation, backdrop, brightness, children, color, distortion, grain, grainAmount, opacity, ripples, saturation, style, waves, ...properties },
  forwardedRef
) {
  const theme = useTheme()
  const identity = `phresh-surface-${useId().replaceAll(":", "")}`
  const element = useRef<HTMLDivElement | null>(null)
  const capture = useCallback((node: HTMLDivElement | null) => {
    element.current = node
    if (typeof forwardedRef === "function") forwardedRef(node)
    else if (forwardedRef) forwardedRef.current = node
  }, [forwardedRef])
  const resolved = resolveSurface({ animation, backdrop, brightness, color, distortion, grain, grainAmount, opacity, ripples, saturation, waves }, theme)

  useLayoutEffect(() => {
    const surface = element.current
    if (surface) return prepareSurfaceLayout(surface)
  })

  return <div
    {...properties}
    ref={capture}
    style={{
      borderRadius: theme.radius,
      color: theme.foreground,
      ...style
    }}
  >
    {resolved.refracts && <BackdropLayer
      name="refraction"
      filter={`url("#${identity}-distortion")`}
      zIndex={-3}
    />}
    {resolved.frost && <BackdropLayer name="frost" filter={resolved.frost} zIndex={-2} />}
    <SurfaceBorder color={resolved.material.color} opacity={resolveScale("large", resolved.material.opacity, themeLimits.surface.opacity)} />
    <SurfaceMaterial identity={identity} {...resolved.material} />
    {children}
  </div>
})

/** Draws one uniform inset edge from the same color as the Surface material. */
function SurfaceBorder({ color, opacity }: Readonly<{ color: string, opacity: number }>) {
  const edge = `color-mix(in oklch, ${color} 94%, black)`

  return <div
    data-surface-border=""
    aria-hidden="true"
    style={{
      ...layerStyle,
      zIndex: 0,
      boxSizing: "border-box",
      boxShadow: `inset 0 0 0 1px ${edge}`,
      opacity
    }}
  />
}

/** Keeps refraction and native frost in independent compositor passes. */
function BackdropLayer({ filter, name, zIndex }: Readonly<{ filter: string, name: string, zIndex: number }>) {
  return <div
    data-surface-backdrop={name}
    aria-hidden="true"
    style={{
      ...layerStyle,
      zIndex,
      backdropFilter: filter,
      WebkitBackdropFilter: filter
    }}
  />
}

function resolveSurface(values: SurfaceControls, theme: ThemeProperties) {
  const material = {
    animation: resolveScale(values.animation, theme.surface.animation, themeLimits.surface.animation),
    color: resolveColor(values.color, theme.background),
    distortion: resolveScale(values.distortion, theme.surface.distortion, themeLimits.surface.distortion),
    grain: resolveScale(values.grain, theme.surface.grain, themeLimits.surface.grain),
    grainAmount: resolveScale(values.grainAmount, theme.surface.grainAmount, themeLimits.surface.grainAmount),
    opacity: resolveScale(values.opacity, theme.surface.opacity, themeLimits.surface.opacity),
    ripples: resolveScale(values.ripples, theme.surface.ripples, themeLimits.surface.ripples),
    waves: resolveScale(values.waves, theme.surface.waves, themeLimits.surface.waves)
  }
  const backdrop = resolveScale(values.backdrop, theme.surface.backdrop, themeLimits.surface.backdrop)
  const saturation = resolveMultiplier(values.saturation, theme.surface.saturation, themeLimits.surface.saturation)
  const brightness = resolveMultiplier(values.brightness, theme.surface.brightness, themeLimits.surface.brightness)
  const frost = [
    backdrop === 0 ? "" : `blur(${backdrop}px)`,
    saturation === 1 ? "" : `saturate(${saturation})`,
    brightness === 1 ? "" : `brightness(${brightness})`
  ].filter(Boolean).join(" ")

  return {
    material,
    frost,
    refracts: material.distortion > 0 || material.waves > 0 || material.ripples > 0
  }
}

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
