import { forwardRef, type ComponentPropsWithoutRef } from "react"
import { useSurface, type SurfaceOptions } from "./use-surface.js"

/** Native div properties plus controls for the locally owned material. */
export type SurfaceProps = Omit<ComponentPropsWithoutRef<"div">, keyof SurfaceOptions> & SurfaceOptions

/** Contains content above locally owned Surface material layers. */
export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(function Surface({
  backdrop, children, color, radius, distortion, grain, grainAmount, opacity, saturation, style, ...properties
}, ref) {
  const surface = useSurface({ color, radius, backdrop, distortion, grain, grainAmount, opacity, saturation }, ref)

  return <div {...properties} ref={surface.ref} style={{ ...surface.style, ...style }}>
    {surface.material}
    {children}
  </div>
})
