import { useCallback, useId, useLayoutEffect, useRef, useState } from "react"
import type { CSSProperties, ReactNode, Ref, RefCallback } from "react"
import { SurfaceMaterial } from "./surface-material.js"
import { useAppearanceOptions, type AppearanceOptions } from "./appearance-options.js"
import { colorLightness, orderColors } from "./color.js"

/** Appearance options consumed by the shared material mechanism. */
export type SurfaceOptions = AppearanceOptions

/** Host integration and decorative content; no container or interaction behavior. */
export interface SurfaceResult<Element extends HTMLElement = HTMLElement> {
  readonly ref: RefCallback<Element>
  readonly style: CSSProperties
  readonly material: ReactNode
}

/** Optional material overrides for a component that supplies its own defaults. */
export interface SurfaceOverrides {
  readonly surface?: SurfaceOptions
}

const layerStyle = {
  position: "absolute",
  inset: 0,
  borderRadius: "inherit",
  pointerEvents: "none"
} satisfies CSSProperties

/** Apply ref and style to one host supporting decorative children, then render material inside it. */
export function useSurface<Element extends HTMLElement = HTMLElement>(options: SurfaceOptions = {}, forwardedRef?: Ref<Element>): SurfaceResult<Element> {
  const { radius, foreground, backdrop, saturation, brightness, ...material } = useAppearanceOptions(options)
  const frost = [
    backdrop === 0 ? "" : `blur(${backdrop}px)`,
    saturation === 1 ? "" : `saturate(${saturation})`,
    brightness === 1 ? "" : `brightness(${brightness})`
  ].filter(Boolean).join(" ")
  const refracts = material.distortion > 0 || material.waves > 0 || material.ripples > 0
  const identity = `phresh-surface-${useId().replaceAll(":", "")}`
  const element = useRef<Element | null>(null)
  const base = useRef<SVGRectElement>(null)
  const [colors, setColors] = useState<(ReturnType<typeof orderColors> & { background: string, foreground: string, lightness: number }) | null>(null)
  const capture = useCallback((node: Element | null) => {
    element.current = node
    if (typeof forwardedRef === "function") {
      const cleanup = forwardedRef(node)
      if (cleanup) return () => { element.current = null; cleanup() }
    }
    else if (forwardedRef) forwardedRef.current = node
  }, [forwardedRef])

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
      background: "transparent",
      borderRadius: radius,
      color: foreground,
    } satisfies CSSProperties,
    material: <>
      {refracts && <BackdropLayer
        name="refraction"
        filter={`url("#${identity}-distortion")`}
        zIndex={-3}
      />}
      {frost && <BackdropLayer name="frost" filter={frost} zIndex={-2} />}
      <SurfaceMaterial identity={identity} foreground="inherit" baseRef={base} colors={colors} {...material} />
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
