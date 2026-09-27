import { useEffect, useRef, useState } from "react"
import type { CSSProperties } from "react"
import { Check } from "lucide-react"
import { useControlMetrics } from "./control/control.js"
import { iconProps } from "./control/icon.js"
import { Readiness, type ReadinessProps, type ReadinessState } from "./readiness.js"
import { Spinner, spinnerDiameter } from "./spinner.js"
import { Surface, type SurfaceOwnProps } from "./surface/surface.js"
import { Text } from "./typography.js"

/** The cover is a Surface: its own props set its color, depth, material, and radius. */
export interface LoadingProps extends Pick<ReadinessProps, "children" | "delay">, SurfaceOwnProps {
  readonly className?: string
  readonly style?: CSSProperties
  /** Lists every requirement with a message, each with its own progress, instead of one message. */
  readonly steps?: boolean
}

/**
 * A Readiness boundary drawn the way the System draws loading: a Surface that
 * covers the waiting interface, with a Spinner and the message of the first
 * waiting requirement, or every step. A requirement's detail is its message
 * when it is a string; other requirements are waited for without being shown.
 *
 * The cover fills the nearest positioned ancestor, which owns its shape. It appears at once and
 * fades out with the Appearance transaction when everything is ready.
 */
export function Loading({ children, delay, steps = false, ...surface }: LoadingProps) {
  return <Readiness delay={delay} status={state => <LoadingCover state={state} steps={steps} surface={surface} />}>
    {children}
  </Readiness>
}

interface Step {
  readonly message: string
  readonly ready: boolean
}

type CoverSurface = Omit<LoadingProps, "children" | "delay" | "steps">

function LoadingCover({ state, steps, surface }: Readonly<{ state: ReadinessState, steps: boolean, surface: CoverSurface }>) {
  const metrics = useControlMetrics()
  const { duration, easing } = metrics.visual
  const { ready } = state
  const [gone, setGone] = useState(false)
  if (!ready && gone) setGone(false)

  // Leaves the tree once faded, so it stops being a layer that repaints over the interface.
  useEffect(() => {
    if (!ready) return
    const timer = setTimeout(() => setGone(true), duration)
    return () => clearTimeout(timer)
  }, [ready, duration])

  // What was shown stays in place while fading out.
  const shown = useRef<readonly Step[]>([])
  if (!ready) shown.current = state.requirements.flatMap(requirement =>
    typeof requirement.detail === "string" ? [{ message: requirement.detail, ready: requirement.ready }] : [])

  if (gone) return null

  const { depth = "flat", radius = 0, style, ...paint } = surface
  const cover: CSSProperties = {
    position: "absolute",
    inset: 0,
    display: "grid",
    placeItems: "center",
    opacity: ready ? 0 : 1,
    // New waiting covers at once; only readiness fades.
    transition: ready ? `opacity ${duration}ms ${easing}` : "none",
    pointerEvents: ready ? "none" : undefined,
    ...style
  }
  const progress = steps ? <StepList steps={shown.current} /> : <Message message={shown.current.find(step => !step.ready)?.message} />

  // Flat and without a shape of its own by default: the container it fills owns its shape.
  return <Surface {...paint} depth={depth} radius={radius} role="status" aria-hidden={ready || undefined} style={cover}>{progress}</Surface>
}

function Message({ message }: Readonly<{ message: string | undefined }>) {
  const metrics = useControlMetrics()
  return <div style={{ display: "grid", justifyItems: "center", gap: metrics.gap * 2 }}>
    <Spinner decorative />
    {message !== undefined && <Text tone="secondary" size="small">{message}</Text>}
  </div>
}

function StepList({ steps }: Readonly<{ steps: readonly Step[] }>) {
  const metrics = useControlMetrics()
  const indicator = spinnerDiameter(metrics.visual.spacing, "small")
  return <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: metrics.gap * 2 }}>
    {steps.map((step, index) => <li key={index} data-ready={step.ready} style={{ display: "flex", alignItems: "center", gap: metrics.gap * 2 }}>
      {step.ready ? <Check {...iconProps(indicator)} /> : <Spinner decorative size="small" />}
      <Text tone={step.ready ? "secondary" : "default"} size="small">{step.message}</Text>
    </li>)}
  </ul>
}
