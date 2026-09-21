import type { ComponentPropsWithRef, CSSProperties, ReactNode } from "react"
import type { MaterialOverrides } from "./material-options.js"
import type { ShadowOverrides } from "./shadow-options.js"
import { Surface } from "./surface.js"

type Paint = Readonly<{ background: string, color: string }>

/** A native button uses Surface without changing its native contract. */
export function SurfaceButton({ native, paint, material: options, shadow }: {
  readonly native: ComponentPropsWithRef<"button">
  readonly paint: Paint
} & MaterialOverrides & ShadowOverrides) {
  const { ref, style, children, ...properties } = native

  return <Surface
    {...properties}
    as="button"
    color={paint.background}
    material={options}
    shadow={shadow}
    ref={ref}
    style={{ ...style, color: paint.color }}
  >
    {children}
  </Surface>
}

/** Void text controls use a material host while retaining native sizing. */
export function SurfaceField({ paint, radius, children, material: options, shadow, style }: Readonly<{
  paint: Paint
  radius: CSSProperties["borderRadius"]
  children: ReactNode
  style?: CSSProperties
} & MaterialOverrides & ShadowOverrides>) {
  return <Surface
    as="span"
    color={paint.background}
    material={options}
    shadow={shadow}
    radius={radius}
    style={{ color: paint.color, display: "grid", minWidth: 0, ...style }}
  >
    {children}
  </Surface>
}
