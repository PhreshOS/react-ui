import { createElement, forwardRef, useId } from "react"
import type { ComponentPropsWithRef, ComponentPropsWithoutRef, CSSProperties, ElementType, ReactElement, ReactNode } from "react"
import { useAppearance, useThemedValue } from "./ui-provider.js"
import { useResolveColor, type Color } from "./color.js"
import { useMaterialOptions, type MaterialOptions, type MaterialOverrides } from "./material-options.js"
import { MaterialPaint } from "./material-paint.js"
import MotionStyle, { useVisualTransition } from "./motion-style.js"
import { resolveRadius, type RadiusProps } from "./radius.js"
import { shadowStyle, useShadowOptions, type ShadowOverrides } from "./shadow-options.js"
import { SurfaceEdge } from "./surface-edge.js"
import type { Direction } from "./direction.js"

export type { MaterialOptions } from "./material-options.js"
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
  const appearance = useAppearance()
  const transition = useVisualTransition()
  const material = useResolvedSurface(color, options)
  const resolvedShadow = useShadowOptions(typeof shadowOptions === "object" ? shadowOptions : undefined)
  const shadow = shadowOptions === false ? "none" : shadowStyle(resolvedShadow)
  const resolvedRadius = resolveRadius(radius ?? "medium", appearance)

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
  }, material.enabled && <SurfaceLayers material={material} />, material.enabled && <SurfaceEdge material={material} />, children)
})

export const Surface = SurfaceRoot as SurfaceComponent

function useResolvedSurface(color: Color | undefined, options?: boolean | MaterialOptions) {
  const appearance = useAppearance()
  const material = useMaterialOptions(typeof options === "object" ? options : undefined)

  return {
    ...material,
    enabled: options !== false,
    color: useResolveColor(color),
    foreground: useThemedValue(appearance.colors).foreground
  }
}

type ResolvedSurface = ReturnType<typeof useResolvedSurface>

const layerStyle = {
  position: "absolute",
  inset: 0,
  borderRadius: "inherit",
  pointerEvents: "none"
} satisfies CSSProperties

function SurfaceLayers({ material }: Readonly<{ material: ResolvedSurface }>) {
  const { backdrop, saturation, distortion } = material
  const frost = [
    backdrop === 0 ? "" : `blur(${backdrop}px)`,
    saturation === 1 ? "" : `saturate(${saturation})`
  ].filter(Boolean).join(" ")
  const identity = `phresh-material-${useId().replaceAll(":", "")}`

  return <span data-material="" aria-hidden="true" style={layerStyle}>
    <MotionStyle />
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
      opacity={material.opacity}
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
