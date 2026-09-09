import { forwardRef, type ComponentPropsWithoutRef } from "react"
import { useSurface, type SurfaceOptions } from "./use-surface.js"

/** Native div properties plus controls for the locally owned material. */
export type SurfaceProps = Omit<ComponentPropsWithoutRef<"div">, keyof SurfaceOptions> & SurfaceOptions

/** Contains content above locally owned Surface material layers. */
export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(function Surface({
  backdrop, brightness, children, color, radius, distortion, grain, grainAmount, opacity, ripples,
  saturation, style, waves, ...properties
}, ref) {
  const surface = useSurface({ color, radius, backdrop, brightness, distortion, grain, grainAmount, opacity, ripples, saturation, waves }, ref)

  return <div {...properties} ref={surface.ref} style={{ ...surface.style, ...style }}>
    {surface.material}
    {children}
  </div>
})
