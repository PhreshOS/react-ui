import { Fragment, useEffect, useMemo, useRef } from "react"

interface SurfaceMaterialProps {
  readonly animation: number
  readonly color: string
  readonly distortion: number
  readonly grain: number
  readonly grainAmount: number
  readonly identity: string
  readonly opacity: number
  readonly ripples: number
  readonly waves: number
}

interface AnimationEntry {
  readonly paint: (frame: number) => void
  readonly rate: number
  frame: number
}

/** The locally owned SVG paint layer inside one Surface. */
export function SurfaceMaterial({ animation, color, distortion, grain, grainAmount, identity, opacity, ripples, waves }: SurfaceMaterialProps) {
  const seed = useMemo(() => seedFrom(identity), [identity])
  const hasPaint = opacity > 0
  const hasGrain = hasPaint && grain > 0 && grainAmount > 0
  const hasDistortion = distortion > 0 || waves > 0 || ripples > 0
  const initial = useMemo(() => hasGrain ? grainPaths(seed, 0, grainAmount) : [], [grainAmount, hasGrain, seed])
  const svg = useRef<SVGSVGElement>(null)
  const paths = useRef<Array<SVGPathElement | null>>([])

  useEffect(() => {
    paths.current.forEach((path, tone) => path?.setAttribute("d", initial[tone] ?? ""))
    if (animation === 0 || !hasGrain || !svg.current) return

    const paint = (frame: number) => {
      const values = grainPaths(seed, frame, grainAmount)
      paths.current.forEach((path, tone) => path?.setAttribute("d", values[tone] ?? ""))
    }

    return animate(svg.current, animation, paint)
  }, [animation, grainAmount, hasGrain, initial, seed])

  if (!hasPaint && !hasDistortion) return null

  return <svg
    ref={svg}
    data-surface-material=""
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
      boxSizing: "border-box",
      opacity,
      pointerEvents: "none"
    }}
  >
    {(hasGrain || hasDistortion) && <defs>
      {hasDistortion && <DistortionFilter
        distortion={distortion}
        identity={identity}
        ripples={ripples}
        seed={seed}
        waves={waves}
      />}
      {hasGrain && <pattern id={`${identity}-grain`} width={patternSize} height={patternSize} patternUnits="userSpaceOnUse">
        {initial.map((path, tone) => <path
          key={tone}
          ref={node => { paths.current[tone] = node }}
          data-surface-grain-tone={tone}
          d={path}
          fill={grainTone(color, tone, grain)}
          shapeRendering="crispEdges"
        />)}
      </pattern>}
    </defs>}
    {hasPaint && <rect data-surface-base="" width="100%" height="100%" fill={color} />}
    {hasGrain && <rect
      data-surface-grain=""
      width="100%"
      height="100%"
      fill={`url(#${identity}-grain)`}
      shapeRendering="crispEdges"
    />}
  </svg>
}

function DistortionFilter({ distortion, identity, ripples, seed, waves }: Readonly<{
  distortion: number
  identity: string
  ripples: number
  seed: number
  waves: number
}>) {
  const fields = [
    distortion > 0 && { name: "organic", strength: distortion, x: "R" },
    waves > 0 && { name: "waves", strength: waves, x: "R" },
    ripples > 0 && { name: "ripples", strength: ripples, x: "B" }
  ].filter((field): field is DistortionField => Boolean(field))
  const scale = fields.reduce((total, field) => total + field.strength, 0)
  const weighted = fields.map(field => `${identity}-${field.name}-weighted`)
  const map = `${identity}-distortion-map`

  return <filter
    id={`${identity}-distortion`}
    data-surface-distortion=""
    x="-20%"
    y="-20%"
    width="140%"
    height="140%"
    colorInterpolationFilters="sRGB"
  >
    {distortion > 0 && <Fragment>
      <feTurbulence
        data-surface-distortion-noise=""
        data-surface-distortion-field="organic"
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
    </Fragment>}
    {waves > 0 && <Fragment>
      <feTurbulence
        data-surface-distortion-field="waves"
        type="turbulence"
        baseFrequency="0.006 0.045"
        numOctaves={1}
        seed={seed + 17}
        result={`${identity}-waves-noise`}
      />
    </Fragment>}
    {ripples > 0 && <Fragment>
      <feTurbulence
        data-surface-distortion-field="ripples"
        type="turbulence"
        baseFrequency="0.055"
        numOctaves={2}
        seed={seed + 31}
        result={`${identity}-ripples-noise`}
      />
    </Fragment>}
    {fields.map(field => <feColorMatrix
      key={field.name}
      data-surface-distortion-weight={field.name}
      in={`${identity}-${field.name}-noise${field.name === "organic" ? "-blurred" : ""}`}
      type="matrix"
      values={weightMatrix(field.x, field.strength / scale)}
      result={`${identity}-${field.name}-weighted`}
    />)}
    {weighted.slice(1).map((field, index) => <feComposite
      key={field}
      data-surface-distortion-combine=""
      in={index === 0 ? weighted[0] : `${identity}-distortion-sum-${index}`}
      in2={field}
      operator="arithmetic"
      k2={1}
      k3={1}
      result={index === weighted.length - 2 ? map : `${identity}-distortion-sum-${index + 1}`}
    />)}
    <feDisplacementMap
      data-surface-distortion-stage="combined"
      in="SourceGraphic"
      in2={weighted.length === 1 ? weighted[0] : map}
      scale={scale}
      xChannelSelector="R"
      yChannelSelector="G"
    />
  </filter>
}

interface DistortionField {
  readonly name: "organic" | "waves" | "ripples"
  readonly strength: number
  readonly x: "R" | "B"
}

function weightMatrix(x: DistortionField["x"], weight: number) {
  const red = x === "R" ? `${weight} 0 0 0 0` : `0 0 ${weight} 0 0`

  return `${red}
          0 ${weight} 0 0 0
          0 0 0 0 0
          0 0 0 1 0`
}

function grainTone(color: string, tone: number, intensity: number) {
  const channel = Math.round(tone / (toneCount - 1) * 255)
  const percentage = Math.round(intensity * 10_000) / 100
  return `color-mix(in srgb, ${color} ${100 - percentage}%, rgb(${channel} ${channel} ${channel}) ${percentage}%)`
}

class AnimationClock {
  readonly #entries = new Set<AnimationEntry>()
  readonly #view: Window
  #request: number | undefined

  constructor(view: Window) {
    this.#view = view
  }

  subscribe(rate: number, paint: (frame: number) => void) {
    const entry = { rate, paint, frame: -1 }
    this.#entries.add(entry)
    this.#start()

    return () => {
      this.#entries.delete(entry)
      if (this.#entries.size === 0) this.#stop()
    }
  }

  #start() {
    if (this.#request !== undefined) return
    this.#request = this.#view.requestAnimationFrame(this.#tick)
  }

  #stop() {
    if (this.#request === undefined) return
    this.#view.cancelAnimationFrame(this.#request)
    this.#request = undefined
  }

  #tick = (time: number) => {
    this.#entries.forEach(entry => {
      const frame = Math.floor(time / 1000 * entry.rate)
      if (frame === entry.frame) return
      entry.frame = frame
      entry.paint(frame)
    })

    this.#request = this.#entries.size === 0
      ? undefined
      : this.#view.requestAnimationFrame(this.#tick)
  }
}

const clocks = new WeakMap<Window, AnimationClock>()

function animate(element: SVGSVGElement, rate: number, paint: (frame: number) => void) {
  const view = element.ownerDocument.defaultView
  if (!view) return

  let clock = clocks.get(view)
  if (!clock) {
    clock = new AnimationClock(view)
    clocks.set(view, clock)
  }

  return clock.subscribe(rate, paint)
}

function grainPaths(seed: number, frame: number, amount: number) {
  const tones = Array.from({ length: toneCount }, () => [] as string[])
  const frameX = frame * 19.17
  const frameY = frame * 7.31

  for (let y = 0; y < patternSize; y += 1) {
    for (let x = 0; x < patternSize; x += 1) {
      const pointX = x + seed * 41
      const pointY = y + seed * 17
      const presence = shaderHash(pointX + frameX + 71.9, pointY + frameY + 13.7)
      if (presence > amount) continue
      const fine = shaderHash(Math.floor(pointX * 1.18) + frameX, Math.floor(pointY * 1.18) + frameY)
      const clustered = shaderHash(Math.floor(pointX * 0.47) + frameX + 31.7, Math.floor(pointY * 0.47) + frameY + 31.7)
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
