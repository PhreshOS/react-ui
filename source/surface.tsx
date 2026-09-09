import { forwardRef, type ComponentPropsWithoutRef } from "react"
import { useAppearance, useResolveTheme } from "./appearance-provider.js"
import { useSurfaceTreatment, type SurfaceControls } from "./surface-treatment.js"
import { color as colorScale, isColorLevel, type ColorLevel } from "./color.js"
import type { RadiusProps } from "./radius.js"
import { isScaleLevel, scale } from "./scale.js"

/** Native div properties plus controls for the locally owned material. */
export type SurfaceProps = Omit<ComponentPropsWithoutRef<"div">, "opacity" | "color"> & SurfaceControls & RadiusProps & {
  /** A level of Appearance's background, or a direct CSS background color. */
  readonly color?: ColorLevel | (string & {})
}

/** Contains content above locally owned Surface material layers. */
export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(function Surface({
  backdrop, brightness, children, color = "base", radius = "medium", distortion, grain, grainAmount, opacity, ripples,
  saturation, style, waves, ...properties
}, ref) {
  const appearance = useAppearance()
  const background = useResolveTheme(appearance.background)
  const corners = useResolveTheme(appearance.radius)
  const treatment = useSurfaceTreatment(
    isColorLevel(color) ? colorScale(background)[color] : color, useResolveTheme(appearance.foreground),
    { backdrop, brightness, distortion, grain, grainAmount, opacity, ripples, saturation, waves }, ref
  )

  return <div {...properties} ref={treatment.ref} style={{
    ...treatment.style,
    borderRadius: isScaleLevel(radius) ? scale(corners, radius) : radius,
    ...style
  }}>
    {treatment.material}
    {children}
  </div>
})
