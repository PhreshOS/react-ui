import type { ComponentPropsWithRef, CSSProperties, ReactNode } from "react"
import { useSurface, type SurfaceOptions } from "./use-surface.js"

type Paint = Readonly<{ background: string, color: string }>

/** A native button owns its material directly; no additional container. */
export function SurfaceButton({ native, paint, options }: { readonly native: ComponentPropsWithRef<"button">, readonly paint: Paint, readonly options?: SurfaceOptions }) {
    const { ref, style, children, ...properties } = native
    const surface = useSurface({ ...options, color: options?.color ?? paint.background, radius: options?.radius ?? style?.borderRadius }, ref)

    return <button {...properties} ref={surface.ref} style={{ ...style, ...surface.style, color: paint.color }}>
        {surface.material}
        {children}
    </button>
}

/** Void text controls need a host for sibling material layers. Native sizing stays on the control. */
export function SurfaceField({ paint, radius, children, options }: Readonly<{
    paint: Paint
    radius: CSSProperties["borderRadius"]
    children: ReactNode
    options?: SurfaceOptions
}>) {
    const surface = useSurface<HTMLSpanElement>({ ...options, color: options?.color ?? paint.background, radius: options?.radius ?? radius })

    return <span ref={surface.ref} style={{ ...surface.style, color: paint.color, display: "grid", minWidth: 0 }}>
        {surface.material}
        {children}
    </span>
}
