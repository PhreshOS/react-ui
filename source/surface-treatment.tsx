import { useCallback, useId, useLayoutEffect, useRef, useState } from "react"
import type { CSSProperties, Ref } from "react"
import {
  appearanceLimits,
  type AppearanceSurface,
  type AppearanceRange
} from "@phreshos/core"
import { isScaleLevel, scale, scaleMultiplier, type ScaleLevel } from "./scale.js"
import { SurfaceMaterial } from "./surface-material.js"
import { useAppearance, useResolveTheme } from "./appearance-provider.js"
import { colorLightness, orderColors } from "./color.js"

/** Controls for the locally owned Surface material. */
export type SurfaceControls = Readonly<{
  /** Appearance-derived level or direct grain intensity from zero to one. */
  grain?: ScaleLevel | number

  /** Appearance-derived level or direct retained grain amount from zero to one. */
  grainAmount?: ScaleLevel | number

  /** Appearance-derived level or direct backdrop blur from zero to 24 CSS pixels. */
  backdrop?: ScaleLevel | number

  /** Appearance-derived level or direct material opacity from zero to one. */
  opacity?: ScaleLevel | number

  /** Appearance-derived level or direct organic displacement from zero to 140 pixels. */
  distortion?: ScaleLevel | number

  /** Appearance-derived level or direct directional displacement from zero to 40 pixels. */
  waves?: ScaleLevel | number

  /** Appearance-derived level or direct ripple displacement from zero to 40 pixels. */
  ripples?: ScaleLevel | number

  /** Appearance-derived level or direct backdrop saturation multiplier. */
  saturation?: ScaleLevel | number

  /** Appearance-derived level or direct backdrop brightness multiplier. */
  brightness?: ScaleLevel | number
}>

const layerStyle = {
  position: "absolute",
  inset: 0,
  borderRadius: "inherit",
  pointerEvents: "none"
} satisfies CSSProperties

/** Contains content above locally owned Surface material layers. */
export function useSurfaceTreatment<Element extends HTMLElement>(background: string, foreground: string, values: SurfaceControls = {}, forwardedRef?: Ref<Element>) {
  const appearance = useAppearance()
  const surface = useResolveTheme(appearance.surface)
  const identity = `phresh-surface-${useId().replaceAll(":", "")}`
  const element = useRef<Element | null>(null)
  const base = useRef<SVGRectElement>(null)
  const [colors, setColors] = useState<(ReturnType<typeof orderColors> & { background: string, foreground: string, lightness: number }) | null>(null)
  const capture = useCallback((node: Element | null) => {
    element.current = node
    if (typeof forwardedRef === "function") forwardedRef(node)
    else if (forwardedRef) forwardedRef.current = node
  }, [forwardedRef])
  const resolved = resolveSurface(values, background, surface)

  // Resolve the palette in the material's scope for the glass edge.
  // Theme names never determine color lightness.
  useLayoutEffect(() => {
    const material = base.current
    const view = material?.ownerDocument.defaultView
    if (!material || !view) return
    const computed = view.getComputedStyle(material)
    const background = computed.fill
    const foreground = computed.color
    if (colors?.background === background && colors.foreground === foreground) return
    setColors({ ...orderColors(background, foreground), background, foreground, lightness: Math.max(0, Math.min(1, colorLightness(background))) })
  })

  useLayoutEffect(() => {
    const surface = element.current
    if (surface) return prepareSurfaceLayout(surface)
  })

  return {
    ref: capture,
    style: {
      color: foreground,
    } satisfies CSSProperties,
    material: <>
    {resolved.refracts && <BackdropLayer
      name="refraction"
      filter={`url("#${identity}-distortion")`}
      zIndex={-3}
    />}
    {resolved.frost && <BackdropLayer name="frost" filter={resolved.frost} zIndex={-2} />}
    <SurfaceMaterial identity={identity} foreground={foreground} baseRef={base} colors={colors} {...resolved.material} />
    </>
  }
}

/** Keeps refraction and native frost in independent compositor passes. */
function BackdropLayer({ filter, name, zIndex }: Readonly<{ filter: string, name: string, zIndex: number }>) {
  return <span
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

function resolveSurface(values: SurfaceControls, background: string, surface: AppearanceSurface) {
  const material = {
    color: background,
    distortion: resolveScale(values.distortion, surface.distortion, appearanceLimits.surface.distortion),
    grain: resolveScale(values.grain, surface.grain, appearanceLimits.surface.grain),
    grainAmount: resolveScale(values.grainAmount, surface.grainAmount, appearanceLimits.surface.grainAmount),
    opacity: resolveScale(values.opacity, surface.opacity, appearanceLimits.surface.opacity),
    ripples: resolveScale(values.ripples, surface.ripples, appearanceLimits.surface.ripples),
    waves: resolveScale(values.waves, surface.waves, appearanceLimits.surface.waves)
  }
  const backdrop = resolveScale(values.backdrop, surface.backdrop, appearanceLimits.surface.backdrop)
  const saturation = resolveMultiplier(values.saturation, surface.saturation, appearanceLimits.surface.saturation)
  const brightness = resolveMultiplier(values.brightness, surface.brightness, appearanceLimits.surface.brightness)
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

function resolveScale(value: ScaleLevel | number | undefined, base: number, range: AppearanceRange) {
  const resolved = isScaleLevel(value) ? scale(base, value) : value ?? base
  const finite = Number.isFinite(resolved) ? resolved : base
  return Math.min(range.maximum, Math.max(range.minimum, finite))
}

function resolveMultiplier(value: ScaleLevel | number | undefined, base: number, range: AppearanceRange) {
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
