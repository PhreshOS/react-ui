import { createElement, forwardRef, useId } from "react"
import type { ComponentPropsWithRef, ComponentPropsWithoutRef, CSSProperties, ElementType, ReactElement, ReactNode } from "react"
import { useResolvedAppearance } from "./appearance-context.js"
import { contrastingColor, defaultColor, resolveColor, type Color } from "./color.js"
import { resolveMaterialOptions, type MaterialMode, type MaterialOptions, type MaterialOverrides } from "./material-options.js"
import { MaterialPaint } from "./material-paint.js"
import { paintTransition, transitionTiming, visualTransition } from "./motion-style.js"
import { resolveRadius, type RadiusProps } from "./radius.js"
import { resolveShadowOptions, shadowStyle, type ShadowOverrides } from "./shadow-options.js"
import { SurfaceEdge } from "./surface-edge.js"
import type { Direction } from "./direction.js"

export type { MaterialMode, MaterialOptions } from "./material-options.js"
export type { ShadowOptions } from "./shadow-options.js"

export interface SurfaceOwnProps extends MaterialOverrides, ShadowOverrides, RadiusProps {
  readonly color?: Color
}

/**
 * The structural properties a component must preserve when it hosts a Surface.
 * The component must apply `style` and render `children` on the same host element,
 * and it must forward its ref to that element.
 */
export interface SurfaceHostProps {
  readonly children?: ReactNode
  readonly dir?: Direction
  readonly style?: CSSProperties
}

export type SurfaceHost = ElementType<SurfaceHostProps>

export type SurfaceProps<As extends SurfaceHost = "div"> = SurfaceOwnProps
  & Readonly<{ as?: As }>
  & Omit<ComponentPropsWithRef<As>, keyof SurfaceOwnProps | "as" | "color">

export type SurfaceComponent = <As extends SurfaceHost = "div">(
  properties: SurfaceProps<As>
) => ReactElement | null

type SurfaceImplementationProps = SurfaceOwnProps
  & Readonly<{ as?: ElementType }>
  & Omit<ComponentPropsWithoutRef<"div">, keyof SurfaceOwnProps | "as" | "color">

/** One material- and shadow-owning element. The host is a div unless `as` selects another element. */
const SurfaceRoot = forwardRef<Element, SurfaceImplementationProps>(function Surface({
  as: Element = "div",
  color,
  material: options,
  shadow: shadowOptions,
  radius,
  children,
  style,
  ...properties
}, ref) {
  const resolved = useResolvedAppearance()
  const transition = visualTransition(resolved.transaction, resolved.preferences.animations)
  const material = resolveSurface(color, options, resolved)
  const resolvedShadow = resolveShadowOptions(
    typeof shadowOptions === "object" ? shadowOptions : {},
    resolved.shadow
  )
  const shadow = shadowOptions === false ? "none" : shadowStyle(resolvedShadow)
  const resolvedRadius = resolveRadius(radius ?? "medium", resolved.appearance)
  const timing = transitionTiming(resolved.transaction, resolved.preferences.animations)
  const paintTiming = paintTransition(resolved.transaction, resolved.preferences.animations)

  return createElement(Element, {
    ...properties,
    ref,
    style: {
      ...transition,
      ...style,
      background: material.enabled ? "transparent" : material.color,
      boxShadow: shadow,
      color: style?.color ?? material.foreground,
      borderRadius: radius === undefined ? style?.borderRadius ?? resolvedRadius : resolvedRadius,
      position: style?.position ?? "relative",
      isolation: "isolate"
    }
  }, material.enabled && <SurfaceLayers material={material} paintTransition={paintTiming} />, material.enabled && <SurfaceEdge material={material} transition={timing} />, children)
})

export const Surface = SurfaceRoot as SurfaceComponent

function resolveSurface(
  color: Color | undefined,
  options: MaterialMode | MaterialOptions | undefined,
  resolved: ReturnType<typeof useResolvedAppearance>
) {
  const mode = typeof options === "object" ? "full" : options ?? "opaque"
  const level = materialLevel[mode]
  const material = resolveMaterialOptions(typeof options === "object" ? options : {}, resolved.material)
  const fill = resolveColor(color, resolved.colors)
  const opacity = level >= materialLevel.translucent ? material.opacity : 1
  const backdrop = level >= materialLevel.full

  return {
    ...material,
    enabled: level >= materialLevel.opaque,
    opacity,
    fillOpacity: opacity,
    backdrop: backdrop ? material.backdrop : 0,
    distortion: backdrop ? material.distortion : 0,
    saturation: backdrop ? material.saturation : 1,
    color: fill,
    foreground: contrastingColor(color ?? defaultColor, resolved.colors)
  }
}

const materialLevel = Object.freeze({
  none: 0,
  opaque: 1,
  translucent: 2,
  full: 3
} satisfies Readonly<Record<MaterialMode, number>>)

type ResolvedSurface = ReturnType<typeof resolveSurface>

const layerStyle = {
  position: "absolute",
  inset: 0,
  borderRadius: "inherit",
  pointerEvents: "none"
} satisfies CSSProperties

function SurfaceLayers({ material, paintTransition }: Readonly<{
  material: ResolvedSurface
  paintTransition: CSSProperties
}>) {
  const filtersVisible = material.fillOpacity < 1
  const backdrop = filtersVisible ? material.backdrop : 0
  const saturation = filtersVisible ? material.saturation : 1
  const distortion = filtersVisible ? material.distortion : 0
  const frost = [
    backdrop === 0 ? "" : `blur(${backdrop}px)`,
    saturation === 1 ? "" : `saturate(${saturation})`
  ].filter(Boolean).join(" ")
  const identity = `phresh-material-${useId().replaceAll(":", "")}`

  return <span data-material="" aria-hidden="true" style={layerStyle}>
    {distortion > 0 && <BackdropLayer
      name="refraction"
      filter={`url("#${identity}-distortion")`}
      zIndex={-3}
    />}
    {frost && <BackdropLayer name="frost" filter={frost} zIndex={-2} />}
    <MaterialPaint
      identity={identity}
      distortion={distortion}
      color={material.color}
      grain={material.grain}
      grainAmount={material.grainAmount}
      opacity={material.fillOpacity}
      transition={paintTransition}
    />
  </span>
}

/** Keep refraction and native frost in independent compositor passes. */
function BackdropLayer({ filter, name, zIndex }: Readonly<{ filter: string, name: string, zIndex: number }>) {
  return <span
    data-material-backdrop={name}
    aria-hidden="true"
    style={{
      ...layerStyle,
      zIndex,
      backdropFilter: filter,
      WebkitBackdropFilter: filter
    }}
  />
}
