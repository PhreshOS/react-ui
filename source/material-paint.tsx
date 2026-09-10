import { useMemo } from "react"
import { paintTransition } from "./motion-style.js"

interface MaterialPaintProps {
  readonly color: string
  readonly distortion: number
  readonly grain: number
  readonly grainAmount: number
  readonly identity: string
  readonly opacity: number
}

/** The fill, refraction definition, and grain of one Material. */
export function MaterialPaint({ color, distortion, grain, grainAmount, identity, opacity }: MaterialPaintProps) {
  const seed = useMemo(() => seedFrom(identity), [identity])
  const hasPaint = opacity > 0
  const hasGrain = hasPaint && grain > 0 && grainAmount > 0
  const hasDistortion = distortion > 0
  const initial = useMemo(() => hasGrain ? grainPaths(seed, grainAmount) : [], [grainAmount, hasGrain, seed])

  if (!hasPaint && !hasDistortion) return null

  return <svg
      data-material-paint=""
      aria-hidden="true"
      focusable="false"
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
      {(hasGrain || hasDistortion) && <defs>
        {hasDistortion && <DistortionFilter distortion={distortion} identity={identity} />}
        {hasGrain && <pattern id={`${identity}-grain`} width={patternSize} height={patternSize} patternUnits="userSpaceOnUse">
          {initial.map((path, tone) => <path
            key={tone}
            data-material-grain-tone={tone}
            d={path}
            fill={grainTone(color, tone, grain)}
            shapeRendering="crispEdges"
          />)}
        </pattern>}
      </defs>}
      {hasPaint && <g data-material-fill="" opacity={opacity} style={paintTransition}>
        <rect data-material-base="" width="100%" height="100%" style={{ ...paintTransition, fill: color }} />
        {hasGrain && <rect
          data-material-grain=""
          width="100%"
          height="100%"
          fill={`url(#${identity}-grain)`}
          shapeRendering="crispEdges"
        />}
      </g>}
    </svg>
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

function grainTone(color: string, tone: number, intensity: number) {
  const channel = Math.round(tone / (toneCount - 1) * 255)
  const percentage = Math.round(intensity * 10_000) / 100
  return `color-mix(in srgb, ${color} ${100 - percentage}%, rgb(${channel} ${channel} ${channel}) ${percentage}%)`
}

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
