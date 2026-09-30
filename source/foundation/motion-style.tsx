import type { CSSProperties } from "react"
import type { Visual } from "./visual.js"
import { timing } from "./timing.js"

/** Per-overlay variables consumed by the shared entrance keyframes. */
export function overlayTransition(visual: Visual): CSSProperties {
  return {
    "--phreshos-ui-motion-duration": `${visual.duration}ms`,
    "--phreshos-ui-motion-easing": visual.easing
  } as CSSProperties
}

/**
 * How long one pass of a repeating motion takes, such as an indeterminate
 * progress sweep or a skeleton pulse: eight changes in place, and never
 * quicker than a calm breath.
 */
export function loopDuration(visual: Visual): number {
  return Math.max(900, timing("change", { tempo: visual.appearance.tempo }).duration * 8)
}

/** The stacking layer of content above an interface: dialogs and notifications. */
export const overlayLayer = 1_000

export const overlayMotionClass = "phreshos-ui-overlay"
export const backdropMotionClass = "phreshos-ui-backdrop"

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
.phreshos-ui-text-control::placeholder {
  color: inherit;
  opacity: 0.55;
}
.phreshos-ui-text-control::-webkit-search-cancel-button,
.phreshos-ui-text-control::-webkit-search-decoration {
  display: none;
}
.phreshos-ui-drawer[data-state="opening"] {
  animation: phreshos-ui-drawer-in var(--phreshos-ui-motion-duration) var(--phreshos-ui-motion-easing);
}
.phreshos-ui-drawer[data-state="closing"] {
  animation: phreshos-ui-drawer-out var(--phreshos-ui-motion-duration) var(--phreshos-ui-motion-easing) forwards;
}
:dir(rtl).phreshos-ui-drawer[data-state="opening"] { animation-name: phreshos-ui-drawer-in-rtl; }
:dir(rtl).phreshos-ui-drawer[data-state="closing"] { animation-name: phreshos-ui-drawer-out-rtl; }
@keyframes phreshos-ui-drawer-in { from { translate: calc(-100% - 1rem) 0; } }
@keyframes phreshos-ui-drawer-out { to { translate: calc(-100% - 1rem) 0; } }
@keyframes phreshos-ui-drawer-in-rtl { from { translate: calc(100% + 1rem) 0; } }
@keyframes phreshos-ui-drawer-out-rtl { to { translate: calc(100% + 1rem) 0; } }
@keyframes phreshos-ui-spin {
  to { rotate: 360deg; }
}
@keyframes phreshos-ui-pulse {
  50% { opacity: 0.55; }
}
@keyframes phreshos-ui-sweep {
  from { inset-inline-start: -40%; }
  to { inset-inline-start: 100%; }
}
`

/** React hoists and deduplicates this stylesheet, including inside portals. */
export default function MotionStyle() {
  return <style href="phreshos-react-ui-motion" precedence="phreshos">{stylesheet}</style>
}

export const textControlClass = "phreshos-ui-text-control"
