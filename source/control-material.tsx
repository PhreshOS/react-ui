import type { ComponentPropsWithRef, CSSProperties, ReactNode } from "react"
import { Surface, type SurfaceOptions } from "./surface.js"

type Paint = Readonly<{ background: string, color: string }>

/** A native button owns its Surface directly; no additional container. */
export function SurfaceButton({ native, paint, options }: { readonly native: ComponentPropsWithRef<"button">, readonly paint: Paint, readonly options?: SurfaceOptions }) {
  const { ref, style, children, ...properties } = native

  return <Surface
    {...properties}
    as="button"
    ref={ref}
    {...options}
    color={options?.color ?? paint.background}
    radius={options?.radius ?? style?.borderRadius}
    style={{ ...style, background: "transparent", color: paint.color }}
  >
    {children}
  </Surface>
}

/** Void text controls use a Surface host while retaining native sizing. */
export function SurfaceField({ paint, radius, children, options }: Readonly<{
  paint: Paint
  radius: CSSProperties["borderRadius"]
  children: ReactNode
  options?: SurfaceOptions
}>) {
  return <Surface
    as="span"
    {...options}
    color={options?.color ?? paint.background}
    radius={options?.radius ?? radius}
    style={{ color: paint.color, display: "grid", minWidth: 0 }}
  >
    {children}
  </Surface>
}
