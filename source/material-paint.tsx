import { useMemo } from "react"
import type { CSSProperties } from "react"

interface MaterialPaintProps {
  readonly color: string
  readonly distortion: number
  readonly grain: number
  readonly grainAmount: number
  readonly identity: string
  readonly opacity: number
  readonly transition: CSSProperties
}

/** The fill, refraction definition, and grain of one Surface. */
export function MaterialPaint({ color, distortion, grain, grainAmount, identity, opacity, transition }: MaterialPaintProps) {
  const grainSeed = useMemo(() => grainSeeds[seedFrom(identity) % grainSeeds.length] ?? grainSeeds[0], [identity])
  const grainResource = useMemo(() => grainImage(grainSeed, grainAmount), [grainSeed, grainAmount])
  const hasPaint = opacity > 0
  const hasGrain = hasPaint && grain > 0 && grainAmount > 0
  const hasDistortion = distortion > 0

  if (!hasPaint && !hasDistortion) return null

  return <span
      data-material-paint=""
      aria-hidden="true"
      style={{
        position: "absolute",
        zIndex: -1,
        inset: 0,
        display: "block",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        borderRadius: "inherit",
        pointerEvents: "none"
      }}
    >
      {hasDistortion && <svg width="0" height="0" focusable="false" style={{ position: "absolute" }}>
        <defs><DistortionFilter distortion={distortion} identity={identity} /></defs>
      </svg>}
      {hasPaint && <span data-material-fill="" data-material-base="" style={{
        position: "absolute",
        inset: 0,
        borderRadius: "inherit",
        background: color,
        opacity,
        ...transition,
        transitionProperty: "background-color, opacity"
      }}>
        {hasGrain && <span data-material-grain="" style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          backgroundImage: grainResource,
          backgroundRepeat: "repeat",
          backgroundSize: `${patternSize}px ${patternSize}px`,
          mixBlendMode: "soft-light",
          opacity: grain
        }} />}
      </span>}
    </span>
}

function DistortionFilter({ distortion, identity }: Readonly<{
  distortion: number
  identity: string
}>) {
  return <filter
    id={`${identity}-distortion`}
    data-material-distortion=""
    x="-20%"
    y="-20%"
    width="140%"
    height="140%"
    colorInterpolationFilters="sRGB"
  >
    <feTurbulence
      data-material-distortion-noise=""
      data-material-distortion-field="organic"
      type="fractalNoise"
      baseFrequency="0.008 0.008"
      numOctaves={2}
      seed={92}
      result={`${identity}-organic-noise`}
    />
    <feGaussianBlur
      in={`${identity}-organic-noise`}
      stdDeviation={2}
      result={`${identity}-organic-noise-blurred`}
    />
    <feDisplacementMap
      data-material-distortion-stage="organic"
      in="SourceGraphic"
      in2={`${identity}-organic-noise-blurred`}
      scale={distortion}
      xChannelSelector="R"
      yChannelSelector="G"
    />
  </filter>
}

function grainImage(seed: number, amount: number) {
  const threshold = -20 * (1 - amount)
  return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${patternSize}" height="${patternSize}" viewBox="0 0 ${patternSize} ${patternSize}"><filter id="n" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency=".82" numOctaves="3" seed="${seed}" stitchTiles="stitch"/><feColorMatrix type="matrix" values=".333 .333 .333 0 0 .333 .333 .333 0 0 .333 .333 .333 0 0 .333 .333 .333 0 0"/><feComponentTransfer><feFuncA type="linear" slope="20" intercept="${threshold}"/></feComponentTransfer></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`)}")`
}

function seedFrom(value: string) {
  let seed = 2166136261
  for (const character of value) {
    seed ^= character.codePointAt(0) ?? 0
    seed = Math.imul(seed, 16777619)
  }
  return (seed >>> 0) % 997 + 1
}

const patternSize = 64
const grainSeeds = [19, 47, 83, 131] as const
