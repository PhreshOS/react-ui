import { forwardRef, useId } from "react"
import type { ComponentPropsWithoutRef } from "react"
import {
  color as deriveColor,
  scale,
  scaleMultiplier,
  themeLimits,
  type Colorable,
  type ColorLevel,
  type ScaleLevel
} from "@phreshos/core"
import { colorOpacity } from "./color.js"
import { resolveRadius, type RadiusProps } from "./radius.js"
import { useTheme } from "./theme-provider.js"

/** Native properties accepted by the shared glass container. */
export type GlassSurfaceProps = ComponentPropsWithoutRef<"div"> & Colorable<ColorLevel> & RadiusProps & Readonly<{
  /** Distortion derived from the Theme's concrete default. */
  distortion?: ScaleLevel

  /** Blur derived from the Theme's concrete default. */
  blur?: ScaleLevel

  /** Saturation derived from the Theme's concrete default. */
  saturation?: ScaleLevel

  /** Brightness derived from the Theme's concrete default. */
  brightness?: ScaleLevel

  /** Material opacity derived from the Theme's concrete default. */
  opacity?: ScaleLevel
}>

const shell = "inset 1px 1px 0 rgba(255, 255, 255, 0.7), inset -1px -1px 0 rgba(255, 255, 255, 0.28)"

/**
 * Contains content within the shared refracted glass material.
 *
 * Layout, spacing, radius, and external elevation remain the responsibility of
 * the containing interface. Only the material itself is owned here.
 */
export const GlassSurface = forwardRef<HTMLDivElement, GlassSurfaceProps>(function GlassSurface(
  {
    blur = "medium",
    brightness = "medium",
    children,
    color = "base",
    distortion = "medium",
    opacity = "medium",
    radius,
    saturation = "medium",
    style,
    ...properties
  },
  ref
) {
  const theme = useTheme()
  const filter = `phresh-glass-${useId().replaceAll(":", "")}`
  const backdrop = glassBackdrop(theme.glass, { blur, brightness, saturation })
  const alpha = boundedOpacity(scale(theme.glass.opacity, opacity))
  const tint = deriveColor(theme.background)[color]
  const borderRadius = resolveRadius(radius, theme)

  return <div
    {...properties}
    ref={ref}
    style={{
      ...style,
      ...(borderRadius === undefined ? {} : { borderRadius }),
      color: theme.foreground,
      backgroundColor: colorOpacity(tint, alpha),
      backgroundImage: `linear-gradient(to bottom, ${colorOpacity(tint, boundedOpacity(alpha * 5 / 3))}, ${colorOpacity(tint, boundedOpacity(alpha / 2))})`,
      boxShadow: shell,
      backdropFilter: `url(#${filter}) ${backdrop}`,
      WebkitBackdropFilter: backdrop,
      isolation: "isolate",
      overflow: "hidden"
    }}
  >
    <svg aria-hidden="true" width="0" height="0" style={{ position: "absolute" }}>
      <filter id={filter} x="0%" y="0%" width="100%" height="100%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.008 0.008"
          numOctaves="2"
          seed="92"
          result="noise"
        />
        <feGaussianBlur in="noise" stdDeviation="2" result="blurred" />
        <feDisplacementMap
          in="SourceGraphic"
          in2="blurred"
          scale={scale(theme.glass.distortion, distortion)}
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
    {children}
  </div>
})

function glassBackdrop(
  glass: Readonly<{ blur: number, saturation: number, brightness: number }>,
  levels: Readonly<{ blur: ScaleLevel, saturation: ScaleLevel, brightness: ScaleLevel }>
) {
  return `blur(${scale(glass.blur, levels.blur)}px) saturate(${scaleMultiplier(glass.saturation, levels.saturation)}) brightness(${scaleMultiplier(glass.brightness, levels.brightness)})`
}

/** Keeps every derived tint within the system's maximum glass opacity. */
function boundedOpacity(value: number) {
  return Math.round(Math.min(themeLimits.glass.opacity.maximum, Math.max(0, value)) * 10_000) / 10_000
}
