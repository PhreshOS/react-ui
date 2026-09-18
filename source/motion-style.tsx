import type { CSSProperties } from "react"
import type { Transition } from "motion/react"
import type { AppearanceTransaction, Easing } from "./appearance.js"

const visualProperties = "background-color, color, border-color, border-radius, box-shadow"
const paintProperties = "fill, stroke, opacity"

export function controlTransition(transaction: AppearanceTransaction, animations: boolean): Transition {
  return {
    type: "tween",
    duration: animations ? transaction.duration / 1_000 : 0,
    ease: motionEasing(transaction.easing)
  }
}

/** Per-overlay variables consumed by the shared entrance keyframes. */
export function overlayTransition(transaction: AppearanceTransaction, animations: boolean): CSSProperties {
  return {
    "--phreshos-ui-motion-duration": `${animations ? transaction.duration : 0}ms`,
    "--phreshos-ui-motion-easing": cssEasing(transaction.easing)
  } as CSSProperties
}

export const overlayMotionClass = "phreshos-ui-overlay"
export const backdropMotionClass = "phreshos-ui-backdrop"

export function transitionTiming(transaction: AppearanceTransaction, animations: boolean): CSSProperties {
  return {
    transitionDuration: `${animations ? transaction.duration : 0}ms`,
    transitionTimingFunction: cssEasing(transaction.easing)
  }
}

export function visualTransition(transaction: AppearanceTransaction, animations: boolean): CSSProperties {
  return { ...transitionTiming(transaction, animations), transitionProperty: visualProperties }
}

export function paintTransition(transaction: AppearanceTransaction, animations: boolean): CSSProperties {
  return { ...transitionTiming(transaction, animations), transitionProperty: paintProperties }
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
