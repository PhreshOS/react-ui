import type { CSSProperties } from "react"
import { useControlMetrics } from "./control/control.js"
import { separatorColor } from "./control/field.js"
import MotionStyle, { loopDuration } from "./foundation/motion-style.js"
import { resolveRadius, type Radius } from "./foundation/radius.js"

export interface SkeletonProps {
  /** Lines of text to hold the place of. Omitted, the Skeleton is one block sized by `style`. */
  readonly lines?: number
  readonly radius?: Radius
  readonly className?: string
  readonly style?: CSSProperties
}

/** The last line of a paragraph ends short, at the golden ratio of the others. */
const lastLine = `${(1 / 1.618) * 100}%`

/**
 * The place of content that is still loading, in the separator paint so it
 * sits quietly on any Surface. It pulses at the pace of every repeating motion
 * and stands still when animations are off.
 */
export function Skeleton({ lines, radius, className, style }: SkeletonProps) {
  const metrics = useControlMetrics()
  const visual = metrics.visual
  const paint: CSSProperties = {
    display: "block",
    background: separatorColor(metrics),
    borderRadius: resolveRadius(radius ?? "small", visual.radius),
    animation: visual.duration > 0 ? `phreshos-ui-pulse ${loopDuration(visual)}ms ${visual.easing} infinite` : undefined
  }

  if (lines === undefined) return <><MotionStyle /><span aria-hidden="true" className={className} style={{ ...paint, height: metrics.height, ...style }} /></>

  return <><MotionStyle /><span aria-hidden="true" className={className} style={{ display: "grid", gap: "0.5lh", ...style }}>
    {Array.from({ length: lines }, (_, index) => <span key={index} style={{
      ...paint,
      height: "1em",
      width: index === lines - 1 && lines > 1 ? lastLine : "100%"
    }} />)}
  </span></>
}
