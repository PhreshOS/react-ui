import { useEffect, useId, useMemo, useRef } from "react"

interface SurfaceMaterialProps {
  readonly animation: number
  readonly color: string
  readonly grain: number
  readonly opacity: number
}

interface AnimationEntry {
  readonly paint: (frame: number) => void
  readonly rate: number
  frame: number
}

/** The locally owned SVG paint layer inside one Surface. */
export function SurfaceMaterial({ animation, color, grain, opacity }: SurfaceMaterialProps) {
  const identity = `phresh-surface-${useId().replaceAll(":", "")}`
  const seed = useMemo(() => seedFrom(identity), [identity])
  const initial = useMemo(() => grainPaths(seed, 0), [seed])
  const svg = useRef<SVGSVGElement>(null)
  const paths = useRef<Array<SVGPathElement | null>>([])

  useEffect(() => {
    paths.current.forEach((path, tone) => path?.setAttribute("d", initial[tone] ?? ""))
    if (animation === 0 || !svg.current) return

    const paint = (frame: number) => {
      const values = grainPaths(seed, frame)
      paths.current.forEach((path, tone) => path?.setAttribute("d", values[tone] ?? ""))
    }

    return animate(svg.current, animation, paint)
  }, [animation, initial, seed])

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
      opacity,
      pointerEvents: "none"
    }}
  >
    <defs>
      <pattern id={identity} width={patternSize} height={patternSize} patternUnits="userSpaceOnUse">
        {initial.map((path, tone) => {
          const channel = Math.round(tone / (toneCount - 1) * 255)
          return <path
            key={tone}
            ref={node => { paths.current[tone] = node }}
            data-surface-grain-tone={tone}
            d={path}
            fill={`rgb(${channel}, ${channel}, ${channel})`}
            shapeRendering="crispEdges"
          />
        })}
      </pattern>
    </defs>
    <rect data-surface-base="" width="100%" height="100%" fill={color} />
    <rect
      data-surface-grain=""
      width="100%"
      height="100%"
      fill={`url(#${identity})`}
      opacity={grain}
      shapeRendering="crispEdges"
    />
    <rect
      data-surface-edge=""
      width="100%"
      height="100%"
      fill="none"
      stroke="rgb(15, 17, 21)"
      strokeOpacity="0.08"
      strokeWidth="2"
      vectorEffect="non-scaling-stroke"
    />
  </svg>
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

function grainPaths(seed: number, frame: number) {
  const tones = Array.from({ length: toneCount }, () => [] as string[])
  const frameX = frame * 19.17
  const frameY = frame * 7.31

  for (let y = 0; y < patternSize; y += 1) {
    for (let x = 0; x < patternSize; x += 1) {
      const pointX = x + seed * 41
      const pointY = y + seed * 17
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
