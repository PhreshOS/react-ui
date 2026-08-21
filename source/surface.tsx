import { forwardRef } from "react"
import type { ComponentPropsWithoutRef, CSSProperties } from "react"

/** Native properties accepted by the shared surface. */
export type SurfaceProps = ComponentPropsWithoutRef<"div">

/**
 * Contains content within the system's shared opaque material.
 *
 * Surface currently owns only its material. Layout, spacing, shape, and
 * elevation remain ordinary native container concerns.
 */
export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(function Surface(
  { style, ...properties },
  ref
) {
  return <div
    {...properties}
    ref={ref}
    style={{ ...material, ...style }}
  />
})

const grain = "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 0.204 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")"

const tactile = "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseTactile'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0.0495 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseTactile)'/%3E%3C/svg%3E\")"

const specular = "linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(240, 238, 230, 0.12) 60%, rgba(210, 208, 200, 0.18) 100%)"

const material = Object.freeze({
  backgroundColor: "#f5f4ee",
  backgroundImage: `${specular}, ${tactile}, ${grain}`,
  backgroundBlendMode: "normal, overlay, multiply",
  border: "1px solid rgba(15, 17, 21, 0.08)",
  color: "#17181c"
}) satisfies CSSProperties
