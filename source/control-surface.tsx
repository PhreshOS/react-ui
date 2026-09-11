import type { ComponentPropsWithRef, CSSProperties, ReactNode } from "react"
import type { MaterialOptions } from "./material-options.js"
import { Surface } from "./surface.js"

type Paint = Readonly<{ background: string, color: string }>

/** A native button uses Surface without changing its native contract. */
export function SurfaceButton({ native, paint, material: options }: { readonly native: ComponentPropsWithRef<"button">, readonly paint: Paint, readonly material?: MaterialOptions }) {
  const { ref, style, children, ...properties } = native

  return <Surface
    {...properties}
    {...options}
    as="button"
    color={paint.background}
    ref={ref}
    style={{ ...style, color: paint.color }}
  >
    {children}
  </Surface>
}

/** Void text controls use a material host while retaining native sizing. */
export function SurfaceField({ paint, radius, children, material: options }: Readonly<{
  paint: Paint
  radius: CSSProperties["borderRadius"]
  children: ReactNode
  material?: MaterialOptions
}>) {
  return <Surface
    {...options}
    as="span"
    color={paint.background}
    radius={radius}
    style={{ color: paint.color, display: "grid", minWidth: 0 }}
  >
    {children}
  </Surface>
}
