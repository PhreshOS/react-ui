import type { ComponentPropsWithRef, CSSProperties, ReactNode } from "react"
import { MaterialLayer, useResolvedMaterial } from "./material.js"
import type { MaterialOptions } from "./material-options.js"
import { SurfaceEdge } from "./surface-edge.js"

type Paint = Readonly<{ background: string, color: string }>

/** A native button hosts Material without changing its native contract. */
export function MaterialButton({ native, paint, material: options }: { readonly native: ComponentPropsWithRef<"button">, readonly paint: Paint, readonly material?: MaterialOptions }) {
  const { ref, style, children, ...properties } = native
  const material = useResolvedMaterial({ color: paint.background, material: options })

  return <button
    {...properties}
    ref={ref}
    style={{ ...style, background: "transparent", color: paint.color, position: style?.position ?? "relative", isolation: "isolate" }}
  >
    <MaterialLayer material={material} />
    <SurfaceEdge material={material} />
    {children}
  </button>
}

/** Void text controls use a material host while retaining native sizing. */
export function MaterialField({ paint, radius, children, material: options }: Readonly<{
  paint: Paint
  radius: CSSProperties["borderRadius"]
  children: ReactNode
  material?: MaterialOptions
}>) {
  const material = useResolvedMaterial({ color: paint.background, material: options })

  return <span
    style={{ color: paint.color, display: "grid", minWidth: 0, borderRadius: radius, position: "relative", isolation: "isolate" }}
  >
    <MaterialLayer material={material} />
    <SurfaceEdge material={material} />
    {children}
  </span>
}
