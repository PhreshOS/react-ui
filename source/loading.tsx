import { useEffect, useRef, useState } from "react"
import type { CSSProperties, ReactNode } from "react"
import { Check } from "lucide-react"
import { useControlMetrics } from "./control/control.js"
import { iconProps } from "./control/icon.js"
import { Readiness, useReadiness, type ReadinessProps, type ReadinessState } from "./readiness.js"
import { Spinner, spinnerDiameter } from "./spinner.js"
import { Text } from "./typography.js"

export interface LoadingProps extends Pick<ReadinessProps, "children" | "delay"> {
  /** Class of the layer that shows the loading. */
  readonly className?: string
  /** Style of the layer that shows the loading, such as where it stands. */
  readonly style?: CSSProperties
  /** Lists every requirement with a message, each with its own progress, instead of one message. */
  readonly steps?: boolean
}

/**
 * A Readiness boundary drawn the way the System draws loading: the waiting
 * interface is hidden, not covered, and a Spinner with the message of the
 * first waiting requirement, or every step, stands where it will be. Nothing
 * is painted behind the Spinner, so the Surface the interface sits on shows
 * through. A requirement's detail is its message when it is a string; other
 * requirements are waited for without being shown.
 *
 * The loading fills the nearest positioned ancestor. It appears at once; when
 * everything is ready it fades out with the Appearance transaction and the
 * interface appears whole at once.
 */
export function Loading({ children, delay, steps = false, className, style }: LoadingProps) {
  return <Readiness delay={delay} status={state => <LoadingStatus state={state} steps={steps} className={className} style={style} />}>
    <Hidden>{children}</Hidden>
  </Readiness>
}

/**
 * Hides the waiting interface while it keeps its layout, so it appears whole and in place. It
 * draws no box of its own, so the interface stays a direct part of the layout around it; such a
 * box cannot fade, which is why the interface appears at once.
 */
function Hidden({ children }: Readonly<{ children?: ReactNode }>) {
  const { ready } = useReadiness()
  return <div data-loading-content="" style={{ display: "contents", visibility: ready ? undefined : "hidden" }}>{children}</div>
}

interface Step {
  readonly message: string
  readonly ready: boolean
}

function LoadingStatus({ state, steps, className, style }: Readonly<{ state: ReadinessState, steps: boolean, className?: string, style?: CSSProperties }>) {
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

  const layer: CSSProperties = {
    position: "absolute",
    inset: 0,
    display: "grid",
    placeItems: "center",
    opacity: ready ? 0 : 1,
    // New waiting shows at once; only readiness fades.
    transition: ready ? `opacity ${duration}ms ${easing}` : "none",
    pointerEvents: ready ? "none" : undefined,
    ...style
  }
  const progress = steps ? <StepList steps={shown.current} /> : <Message message={shown.current.find(step => !step.ready)?.message} />

  return <div className={className} role="status" aria-hidden={ready || undefined} style={layer}>{progress}</div>
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
