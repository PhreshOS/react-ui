import { forwardRef, useLayoutEffect, useMemo, useRef, useState } from "react"
import type { ComponentPropsWithoutRef, CSSProperties } from "react"
import {
  color as deriveColor,
  isScaleLevel,
  scale,
  themeLimits,
  type ColorLevel,
  type ScaleLevel,
  type ThemeRange
} from "@phreshos/core"
import { registerSurface, type SurfaceRegistration } from "./surface-renderer.js"
import { useTheme } from "./theme-provider.js"

/** A Theme-derived treatment or direct CSS color. */
export type SurfaceColor = ColorLevel | (string & {})

/** Properties accepted by the shared Surface material. */
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

/**
 * Contains content within the shared WebGL Surface material.
 *
 * Every instance presents an independent frame produced by its document's
 * shared renderer. The element remains a normal div and retains an opaque CSS
 * fallback when the required graphics capabilities are unavailable.
 */
export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(function Surface(
  { animation, backdrop, children, color, grain, opacity, style, ...properties },
  forwardedRef
) {
  const theme = useTheme()
  const element = useRef<HTMLDivElement | null>(null)
  const presentation = useRef<HTMLCanvasElement | null>(null)
  const registration = useRef<SurfaceRegistration | null>(null)
  const [webgl, setWebgl] = useState(false)
  const surfaceTheme = theme.surface ?? { ...legacySurface, color: theme.background }
  const surfaceLimits = themeLimits.surface ?? legacyLimits
  const material = useMemo(() => ({
    color: resolveColor(color, surfaceTheme.color),
    grain: resolveScale(grain, surfaceTheme.grain, surfaceLimits.grain),
    animation: resolveScale(animation, surfaceTheme.animation, surfaceLimits.animation),
    backdrop: resolveScale(backdrop, surfaceTheme.backdrop, surfaceLimits.backdrop),
    opacity: resolveScale(opacity, surfaceTheme.opacity, surfaceLimits.opacity)
  }), [animation, backdrop, color, grain, opacity, surfaceLimits, surfaceTheme])

  useLayoutEffect(() => {
    const surface = element.current
    const canvas = presentation.current
    if (!surface || !canvas) return

    registration.current = registerSurface(surface, canvas, material)
    setWebgl(registration.current !== null)

    return () => {
      registration.current?.unregister()
      registration.current = null
    }
  }, [])

  useLayoutEffect(() => registration.current?.update(material), [material])

  const blur = material.backdrop === 0 ? {} : {
    backdropFilter: `blur(${material.backdrop}px)`,
    WebkitBackdropFilter: `blur(${material.backdrop}px)`
  }
  const fallbackColor = material.opacity === 1
    ? material.color
    : `color-mix(in srgb, ${material.color} ${material.opacity * 100}%, transparent)`

  return <div
    {...properties}
    ref={node => {
      element.current = node
      if (typeof forwardedRef === "function") forwardedRef(node)
      else if (forwardedRef) forwardedRef.current = node
    }}
    data-surface-webgl={webgl ? "" : undefined}
    style={{
      borderRadius: theme.radius,
      color: theme.foreground,
      backgroundColor: webgl ? "transparent" : fallbackColor,
      border: webgl ? "1px solid transparent" : border,
      ...blur,
      ...style
    }}
  >
    <canvas
      ref={presentation}
      data-surface-material=""
      aria-hidden="true"
      style={{
        position: "absolute",
        zIndex: -1,
        inset: 0,
        display: webgl ? "block" : "none",
        width: "100%",
        height: "100%",
        borderRadius: "inherit",
        pointerEvents: "none"
      }}
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

const border = "1px solid rgba(15, 17, 21, 0.08)" satisfies CSSProperties["border"]

const legacySurface = Object.freeze({
  color: "#f5f4ee",
  grain: 0.1,
  animation: 0,
  backdrop: 0,
  opacity: 1
})

const legacyLimits = Object.freeze({
  grain: Object.freeze({ minimum: 0, maximum: 1 }),
  animation: Object.freeze({ minimum: 0, maximum: 16 }),
  backdrop: Object.freeze({ minimum: 0, maximum: 24 }),
  opacity: Object.freeze({ minimum: 0, maximum: 1 })
})
