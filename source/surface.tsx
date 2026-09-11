import { forwardRef } from "react"
import type { ComponentPropsWithRef } from "react"
import { useAppearance } from "./appearance-provider.js"
import { MaterialLayer, useResolvedMaterial, type MaterialProps } from "./material.js"
import { visualTransition } from "./motion-style.js"
import { resolveRadius, type RadiusProps } from "./radius.js"
import { SurfaceEdge } from "./surface-edge.js"

/** A div that hosts one Material and owns its geometry. */
export interface SurfaceProps extends Omit<ComponentPropsWithRef<"div">, "color">, MaterialProps, RadiusProps {}

export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(function Surface({
  color,
  material: options,
  radius,
  children,
  style,
  ...properties
}, ref) {
  const appearance = useAppearance()
  const material = useResolvedMaterial({ color, material: options })
  const resolvedRadius = resolveRadius(radius ?? "medium", appearance)

  return <div
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
    <MaterialLayer material={material} />
    <SurfaceEdge material={material} />
    {children}
  </div>
})
