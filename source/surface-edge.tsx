import { Fragment, useCallback, useLayoutEffect, useRef, useState } from "react"
import { colorLightness, colorOpacity, orderColors } from "./color.js"
import { paintTransition } from "./motion-style.js"
import { scale } from "./scale.js"

type EdgeMaterial = Readonly<{ color: string, foreground: string, opacity: number }>

/** Paints the boundary owned by one Surface from the material it contains. */
export function SurfaceEdge({ material }: Readonly<{ material: EdgeMaterial }>) {
  const visible = material.opacity > 0
  const palette = useRef<SVGRectElement>(null)
  const [colors, setColors] = useState<(ReturnType<typeof orderColors> & {
    background: string
    foreground: string
    lightness: number
  }) | null>(null)

  const updatePalette = useCallback(() => {
    const base = palette.current
    const view = base?.ownerDocument.defaultView
    if (!base || !view) return
    const computed = view.getComputedStyle(base)
    const background = computed.fill
    const foreground = computed.color
    setColors(previous => previous?.background === background && previous.foreground === foreground ? previous : {
      ...orderColors(background, foreground),
      background,
      foreground,
      lightness: Math.max(0, Math.min(1, colorLightness(background)))
    })
  }, [])

  useLayoutEffect(updatePalette)

  useLayoutEffect(() => {
    const base = palette.current
    if (!base) return
    const complete = (event: TransitionEvent) => {
      if (event.target === base && (event.propertyName === "fill" || event.propertyName === "color")) updatePalette()
    }
    base.addEventListener("transitionend", complete)
    return () => base.removeEventListener("transitionend", complete)
  }, [updatePalette, visible])

  if (!visible) return null

  return <Fragment>
    <svg data-surface-palette="" aria-hidden="true" width="0" height="0" style={{ position: "absolute", pointerEvents: "none" }}>
      <rect ref={palette} data-surface-palette-base="" style={{ ...paintTransition, fill: material.color, color: material.foreground }} />
    </svg>
    <span
      data-surface-edge=""
      aria-hidden="true"
      style={{
        ...paintTransition,
        position: "absolute",
        zIndex: 1,
        inset: 0,
        padding: 1,
        borderRadius: "inherit",
        pointerEvents: "none",
        opacity: Math.min(1, scale(material.opacity, "xlarge")) * (colors?.lightness ?? 0),
        background: colors ? glassEdge(colors.lighter, colors.darker) : undefined,
        WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
        WebkitMaskComposite: "xor",
        mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
        maskComposite: "exclude"
      }}
    />
  </Fragment>
}

function glassEdge(light: string, dark: string) {
  const edge = `color-mix(in oklch, ${dark} 20%, ${light})`

  return `linear-gradient(145deg, ${colorOpacity(light, 0.92)}, ${colorOpacity(light, 0.4)} 35%, ${colorOpacity(edge, 0.18)} 55%, ${colorOpacity(light, 0.6)} 85%, ${colorOpacity(light, 0.3)})`
}
