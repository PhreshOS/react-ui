import { defaultAppearance, type Easing } from "@phreshos/core"
import type { CSSProperties } from "react"
import type { Transition } from "motion/react"
import { useAppearance } from "./appearance-context.js"

const visualProperties = "background-color, color, border-color, border-radius"
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
export function useControlTransition(reduced = false): Transition {
  const { duration, easing } = useAppearance().transaction
  return {
    type: "tween",
    duration: reduced ? 0 : duration / 1_000,
    ease: motionEasing(easing)
  }
}

/** Per-overlay variables consumed by the shared entrance keyframes. */
export function useOverlayTransition(): CSSProperties {
  const { duration, easing } = useAppearance().transaction
  return {
    "--phreshos-ui-motion-duration": `${duration}ms`,
    "--phreshos-ui-motion-easing": cssEasing(easing)
  } as CSSProperties
}

export const overlayMotionClass = "phreshos-ui-overlay"

function useTransitionTiming(): CSSProperties {
  const { duration, easing } = useAppearance().transaction
  return {
    transitionDuration: `${duration}ms`,
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

.phreshos-ui-overlay { --phreshos-ui-overlay-x: 0px; --phreshos-ui-overlay-y: -4px; }
.phreshos-ui-overlay[data-placement="top"] { --phreshos-ui-overlay-y: 4px; }
.phreshos-ui-overlay[data-placement="left"] { --phreshos-ui-overlay-x: 4px; --phreshos-ui-overlay-y: 0px; }
.phreshos-ui-overlay[data-placement="right"] { --phreshos-ui-overlay-x: -4px; --phreshos-ui-overlay-y: 0px; }
.phreshos-ui-overlay[data-entering] {
  animation: phreshos-ui-overlay-enter var(--phreshos-ui-motion-duration) var(--phreshos-ui-motion-easing) both;
}
.phreshos-ui-overlay[data-exiting] {
  animation: phreshos-ui-overlay-enter var(--phreshos-ui-motion-duration) var(--phreshos-ui-motion-easing) reverse both;
  pointer-events: none;
}
@keyframes phreshos-ui-overlay-enter {
  from { opacity: 0; translate: var(--phreshos-ui-overlay-x) var(--phreshos-ui-overlay-y); }
  to { opacity: 1; translate: 0 0; }
}
@media (prefers-reduced-motion: reduce) {
  :root { --phreshos-ui-motion-duration: 0ms; }
  .phreshos-ui-overlay[data-entering], .phreshos-ui-overlay[data-exiting] { animation: none; }
}
`

/** React hoists and deduplicates this stylesheet, including portals. */
export default function MotionStyle() {
  return <style href="phreshos-react-ui-motion" precedence="phreshos">{stylesheet}</style>
}
