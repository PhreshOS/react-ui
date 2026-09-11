import { useId } from "react"
import type { CSSProperties } from "react"
import { useMaterialOptions, type MaterialOptions } from "./material-options.js"
import { useAppearance, useResolveTheme } from "./appearance-provider.js"
import { useResolveColor, type Color } from "./color.js"
import { MaterialPaint } from "./material-paint.js"
import MotionStyle from "./motion-style.js"

export type { MaterialOptions } from "./material-options.js"

/** Visual substance without host layout, content, interaction, or shadow. */
export interface MaterialProps {
  readonly color?: Color
  readonly material?: MaterialOptions
}

export interface MaterialOverrides {
  readonly material?: MaterialOptions
}

const layerStyle = {
  position: "absolute",
  inset: 0,
  borderRadius: "inherit",
  pointerEvents: "none"
} satisfies CSSProperties

/** Fill the geometry of the nearest positioned host with the resolved material. */
export function Material(options: MaterialProps = {}) {
  const material = useResolvedMaterial(options)

  return <MaterialLayer material={material} />
}

export function useResolvedMaterial({ color, material: options }: MaterialProps = {}) {
  const appearance = useAppearance()
  const material = useMaterialOptions(options)

  return {
    ...material,
    color: useResolveColor(color),
    foreground: useResolveTheme(appearance.colors.foreground)
  }
}

export type ResolvedMaterial = ReturnType<typeof useResolvedMaterial>

export function MaterialLayer({ material }: Readonly<{ material: ResolvedMaterial }>) {
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
