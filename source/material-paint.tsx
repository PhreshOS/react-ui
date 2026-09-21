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
  const hasPaint = opacity > 0
  const hasGrain = hasPaint && grain > 0 && grainAmount > 0
  const hasDistortion = distortion > 0
  const grainResource = useMemo(
    () => hasGrain ? grainImage(grainSeed, grainAmount) : null,
    [grainSeed, grainAmount, hasGrain]
  )

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
          backgroundImage: grainResource ?? undefined,
          backgroundRepeat: "repeat",
          backgroundSize: `${patternSize}px ${patternSize}px`,
          opacity: grain,
          ...transition,
          transitionProperty: "opacity"
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
  const key = `${seed}:${amount}`
  const cached = grainResources.get(key)
  if (cached !== undefined) {
    grainResources.delete(key)
    grainResources.set(key, cached)
    return cached
  }

  const paths = grainPaths(seed, amount)
    .map((path, tone) => path
      ? `<path d="${path}" fill="rgb(${toneChannel(tone)} ${toneChannel(tone)} ${toneChannel(tone)})"/>`
      : "")
    .join("")

  const resource = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${patternSize}" height="${patternSize}" viewBox="0 0 ${patternSize} ${patternSize}">${paths}</svg>`)}")`

  // Preserve the exact texture while avoiding the same expensive SVG generation
  // for every Surface. The bound prevents live grain controls from growing it forever.
  if (grainResources.size >= grainResourceLimit) {
    const oldest = grainResources.keys().next().value
    if (oldest !== undefined) grainResources.delete(oldest)
  }
  grainResources.set(key, resource)
  return resource
}

/** Preserve the original contract: amount is the monotonic density of visible grain pixels. */
function grainPaths(seed: number, amount: number) {
  const tones = Array.from({ length: toneCount }, () => [] as string[])

  for (let y = 0; y < patternSize; y += 1) {
    for (let x = 0; x < patternSize; x += 1) {
      const pointX = x + seed * 41
      const pointY = y + seed * 17
      const presence = shaderHash(pointX + 71.9, pointY + 13.7)
      if (presence > amount) continue

      const fine = shaderHash(Math.floor(pointX * 1.18), Math.floor(pointY * 1.18))
      const clustered = shaderHash(Math.floor(pointX * 0.47) + 31.7, Math.floor(pointY * 0.47) + 31.7)
      const value = clamp(fine * 0.8 + clustered * 0.2, 0, 1)
      const tone = Math.min(toneCount - 1, Math.floor(value * toneCount))
      tones[tone]?.push(`M${x} ${y}h1v1h-1z`)
    }
  }

  return tones.map(tone => tone.join(""))
}

function toneChannel(tone: number) {
  return Math.round(tone / (toneCount - 1) * 255)
}

function shaderHash(x: number, y: number) {
  let red = fract(x * 0.1031)
  let green = fract(y * 0.1031)
  let blue = fract(x * 0.1031)
  const product = red * (green + 33.33) + green * (blue + 33.33) + blue * (red + 33.33)
  red += product
  green += product
  blue += product
  return fract((red + green) * blue)
}

function seedFrom(value: string) {
  let seed = 2166136261
  for (const character of value) {
    seed ^= character.codePointAt(0) ?? 0
    seed = Math.imul(seed, 16777619)
  }
  return (seed >>> 0) % 997 + 1
}

function fract(value: number) {
  return value - Math.floor(value)
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

const patternSize = 64
const toneCount = 16
const grainSeeds = [19, 47, 83, 131] as const
const grainResourceLimit = 64
const grainResources = new Map<string, string>()
