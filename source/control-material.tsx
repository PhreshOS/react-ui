import type { ComponentPropsWithRef, CSSProperties, ReactNode } from "react"
import { useSurfaceTreatment } from "./surface-treatment.js"

type Paint = Readonly<{ background: string, color: string }>

/** A native button owns its material directly; no additional container. */
export function SurfaceButton({ native, paint }: { readonly native: ComponentPropsWithRef<"button">, readonly paint: Paint }) {
    const { ref, style, children, ...properties } = native
    const treatment = useSurfaceTreatment(paint.background, paint.color, {}, ref)

    return <button {...properties} ref={treatment.ref} style={{ ...treatment.style, ...style, background: "transparent" }}>
        {treatment.material}
        {children}
    </button>
}

/** Void text controls need a host for sibling material layers. Native sizing stays on the control. */
export function SurfaceField({ paint, radius, children }: Readonly<{
    paint: Paint
    radius: CSSProperties["borderRadius"]
    children: ReactNode
}>) {
    const treatment = useSurfaceTreatment<HTMLSpanElement>(paint.background, paint.color)

    return <span ref={treatment.ref} style={{ ...treatment.style, borderRadius: radius, display: "grid", minWidth: 0 }}>
        {treatment.material}
        {children}
    </span>
}
