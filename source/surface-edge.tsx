import { Fragment, type CSSProperties } from "react"
import { useTransitionTiming } from "./motion-style.js"
import { scale } from "./scale.js"

type EdgeMaterial = Readonly<{ color: string, opacity: number }>

const edgeLayer = {
  position: "absolute",
  zIndex: 1,
  inset: 0,
  boxSizing: "border-box",
  borderRadius: "inherit",
  pointerEvents: "none"
} satisfies CSSProperties

const edgeScale = 0.8
const outerEdgeThickness = edgeScale
const illuminatedEdgeThickness = 0.3
const illuminatedEdgeBoundary = outerEdgeThickness + illuminatedEdgeThickness

const horizontalIllumination = "linear-gradient(90deg, var(--phreshos-surface-edge-light-minimum) 0%, var(--phreshos-surface-edge-light-minimum) 12%, var(--phreshos-surface-edge-light-soft) 34%, var(--phreshos-surface-edge-light-peak) 50%, var(--phreshos-surface-edge-light-soft) 66%, var(--phreshos-surface-edge-light-minimum) 88%, var(--phreshos-surface-edge-light-minimum) 100%)"
const inwardIllumination = "radial-gradient(ellipse 38% clamp(12px, 14%, 40px) at 50% 0%, var(--phreshos-surface-edge-glow-peak) 0%, var(--phreshos-surface-edge-glow-soft) 35%, transparent 100%), radial-gradient(ellipse 38% clamp(12px, 14%, 40px) at 50% 100%, var(--phreshos-surface-edge-glow-peak) 0%, var(--phreshos-surface-edge-glow-soft) 35%, transparent 100%)"
const edgeMask = "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)"

/** Paints the boundary owned by one Surface from the material it contains. */
export function SurfaceEdge({ material }: Readonly<{ material: EdgeMaterial }>) {
  const timing = useTransitionTiming()
  const visible = material.opacity > 0

  if (!visible) return null

  const opacity = Math.min(1, scale(material.opacity, "xlarge"))

  return <Fragment>
    <span
      data-surface-edge-glow=""
      aria-hidden="true"
      style={{
        ...timing,
        ...edgeLayer,
        transitionProperty: "opacity",
        background: inwardIllumination,
        filter: "blur(0.85px)",
        opacity,
        "--phreshos-surface-edge-glow-peak": illumination(material.color, 12),
        "--phreshos-surface-edge-glow-soft": illumination(material.color, 4)
      } as CSSProperties}
    />
    <span
      data-surface-edge-light=""
      aria-hidden="true"
      style={{
        ...timing,
        ...edgeLayer,
        transitionProperty: "opacity",
        padding: illuminatedEdgeBoundary,
        background: horizontalIllumination,
        opacity,
        WebkitMask: edgeMask,
        WebkitMaskComposite: "xor",
        mask: edgeMask,
        maskComposite: "exclude",
        "--phreshos-surface-edge-light-peak": illumination(material.color, 68),
        "--phreshos-surface-edge-light-soft": illumination(material.color, 44),
        "--phreshos-surface-edge-light-minimum": illumination(material.color, 18)
      } as CSSProperties}
    />
    <span
      data-surface-edge=""
      aria-hidden="true"
      style={{
        ...timing,
        ...edgeLayer,
        transitionProperty: "border-color, opacity",
        borderStyle: "solid",
        borderWidth: outerEdgeThickness,
        borderColor: "var(--phreshos-surface-edge-dark)",
        opacity,
        "--phreshos-surface-edge-dark": darkEdge(material.color)
      } as CSSProperties}
    />
  </Fragment>
}

function darkEdge(color: string) {
  return `color-mix(in srgb, color-mix(in oklch, ${color} 72%, black) 38%, transparent)`
}

function illumination(color: string, opacity: number) {
  return `color-mix(in srgb, color-mix(in oklch, ${color} 64%, white) ${opacity}%, transparent)`
}
