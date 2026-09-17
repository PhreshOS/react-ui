import type { CSSProperties } from "react"
import type { Transition } from "motion/react"
import { defaultAppearance, type Easing } from "./appearance.js"
import { useAppearance, usePreferences } from "./appearance-context.js"

const visualProperties = "background-color, color, border-color, border-radius, box-shadow"
const paintProperties = "fill, stroke, opacity"

/** CSS timing for values painted directly by React UI. */
export function useVisualTransition(): CSSProperties {
  return { ...useTransitionTiming(), transitionProperty: visualProperties }
}

/** CSS timing for SVG paint owned by a Material. */
export function usePaintTransition(): CSSProperties {
  return { ...useTransitionTiming(), transitionProperty: paintProperties }
}

/** Motion timing for interactive geometry owned by React UI. */
export function useControlTransition(): Transition {
  const { duration, easing } = useAppearance().transaction
  const { animations } = usePreferences()
  return {
    type: "tween",
    duration: animations ? duration / 1_000 : 0,
    ease: motionEasing(easing)
  }
}

/** Per-overlay variables consumed by the shared entrance keyframes. */
export function useOverlayTransition(): CSSProperties {
  const { duration, easing } = useAppearance().transaction
  const { animations } = usePreferences()
  return {
    "--phreshos-ui-motion-duration": `${animations ? duration : 0}ms`,
    "--phreshos-ui-motion-easing": cssEasing(easing)
  } as CSSProperties
}

export const overlayMotionClass = "phreshos-ui-overlay"
export const backdropMotionClass = "phreshos-ui-backdrop"

export function useTransitionTiming(): CSSProperties {
  const { duration, easing } = useAppearance().transaction
  const { animations } = usePreferences()
  return {
    transitionDuration: `${animations ? duration : 0}ms`,
    transitionTimingFunction: cssEasing(easing)
  }
}

function cssEasing(easing: Easing) {
  return typeof easing === "string" ? easing : `cubic-bezier(${easing.join(", ")})`
}

function motionEasing(easing: Easing): Transition["ease"] {
  if (typeof easing !== "string") return [...easing]
  if (easing === "ease") return [0.25, 0.1, 0.25, 1]
  if (easing === "ease-in") return "easeIn"
  if (easing === "ease-out") return "easeOut"
  if (easing === "ease-in-out") return "easeInOut"
  return easing
}

const stylesheet = `
:root {
  --phreshos-ui-motion-duration: ${defaultAppearance.transaction.duration}ms;
  --phreshos-ui-motion-easing: ${cssEasing(defaultAppearance.transaction.easing)};
}

.phreshos-ui-overlay[data-entering] {
  animation: phreshos-ui-overlay-enter var(--phreshos-ui-motion-duration) var(--phreshos-ui-motion-easing) both;
}
.phreshos-ui-overlay[data-exiting] {
  animation: phreshos-ui-overlay-enter var(--phreshos-ui-motion-duration) var(--phreshos-ui-motion-easing) reverse both;
  pointer-events: none;
}
.phreshos-ui-backdrop[data-entering] {
  animation: phreshos-ui-backdrop-enter var(--phreshos-ui-motion-duration) var(--phreshos-ui-motion-easing) both;
}
.phreshos-ui-backdrop[data-exiting] {
  animation: phreshos-ui-backdrop-enter var(--phreshos-ui-motion-duration) var(--phreshos-ui-motion-easing) reverse both;
  pointer-events: none;
}
@keyframes phreshos-ui-overlay-enter {
  from { opacity: 0; scale: 1.05; }
  to { opacity: 1; scale: 1; }
}
@keyframes phreshos-ui-backdrop-enter {
  from { opacity: 0; }
  to { opacity: 1; }
}
`

/** React hoists and deduplicates this stylesheet, including portals. */
export default function MotionStyle() {
  return <style href="phreshos-react-ui-motion" precedence="phreshos">{stylesheet}</style>
}
