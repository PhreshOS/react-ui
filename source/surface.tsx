import { forwardRef } from "react"
import type { ComponentPropsWithRef, ElementType, ForwardedRef, ReactElement } from "react"
import { useAppearance } from "./appearance-provider.js"
import { Material, type MaterialProps } from "./material.js"
import { useMaterialOptions } from "./material-options.js"
import { visualTransition } from "./motion-style.js"
import { resolveRadius, type RadiusProps } from "./radius.js"
import { SurfaceEdge } from "./surface-edge.js"

type VoidElement = "area" | "base" | "br" | "col" | "embed" | "hr" | "img" | "input" | "link" | "meta" | "param" | "source" | "track" | "wbr"

/** Native HTML elements that can contain the Surface material and content. */
export type SurfaceElement = Exclude<Extract<keyof React.JSX.IntrinsicElements, keyof HTMLElementTagNameMap>, VoidElement>

/** Appearance values accepted by a Surface and material-bearing controls. */
export interface SurfaceOptions extends MaterialProps, RadiusProps {}

/** Optional Surface overrides for a component that supplies its own defaults. */
export interface SurfaceOverrides {
  readonly surface?: SurfaceOptions
}

type OwnSurfaceProps<Element extends SurfaceElement> = SurfaceOptions & {
  readonly as?: Element
}

/** A Surface's appearance plus the native contract selected by as. */
export type SurfaceProps<Element extends SurfaceElement = "div"> =
  OwnSurfaceProps<Element>
  & Omit<ComponentPropsWithRef<Element>, keyof OwnSurfaceProps<Element>>

type SurfaceComponent = <Element extends SurfaceElement = "div">(
  props: SurfaceProps<Element>
) => ReactElement | null

function SurfaceRoot<Element extends SurfaceElement = "div">({
  as,
  color,
  radius,
  backdrop,
  distortion,
  grain,
  grainAmount,
  opacity,
  saturation,
  children,
  style,
  ...properties
}: SurfaceProps<Element>, ref: ForwardedRef<HTMLElementTagNameMap[Element]>) {
  const appearance = useAppearance()
  const material = useMaterialOptions({ color, backdrop, distortion, grain, grainAmount, opacity, saturation })
  const resolvedRadius = resolveRadius(radius ?? "medium", appearance)
  const Component = (as ?? "div") as ElementType

  return <Component
    {...properties}
    ref={ref}
    style={{
      ...visualTransition,
      background: "transparent",
      color: material.foreground,
      ...style,
      borderRadius: radius === undefined ? style?.borderRadius ?? resolvedRadius : resolvedRadius,
      position: style?.position ?? "relative",
      isolation: "isolate"
    }}
  >
    <Material
      color={color}
      backdrop={backdrop}
      distortion={distortion}
      grain={grain}
      grainAmount={grainAmount}
      opacity={opacity}
      saturation={saturation}
    />
    <SurfaceEdge material={material} />
    {children}
  </Component>
}

/** A material-bearing native host whose element is selected by as. */
export const Surface = forwardRef(SurfaceRoot) as SurfaceComponent
