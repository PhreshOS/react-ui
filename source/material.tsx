import { useId } from "react"
import type { CSSProperties } from "react"
import { useMaterialOptions, type MaterialOptions } from "./material-options.js"
import { MaterialPaint } from "./material-paint.js"
import MotionStyle from "./motion-style.js"

/** Visual substance without host layout, content, interaction, or shadow. */
export type MaterialProps = MaterialOptions

const layerStyle = {
  position: "absolute",
  inset: 0,
  borderRadius: "inherit",
  pointerEvents: "none"
} satisfies CSSProperties

/** Fill the geometry of the nearest positioned host with the resolved material. */
export function Material(options: MaterialProps = {}) {
  const material = useMaterialOptions(options)
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
