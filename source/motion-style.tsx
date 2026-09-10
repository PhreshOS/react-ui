import type { CSSProperties } from "react"

const timing = {
  transitionDuration: "var(--phreshos-ui-motion-duration, 160ms)",
  transitionTimingFunction: "ease-out"
} satisfies CSSProperties

/** Host opacity and filters are excluded: either can change backdrop sampling. */
export const visualTransition = {
  ...timing,
  transitionProperty: "background-color, color, border-color, border-radius"
} satisfies CSSProperties

/** Radius is inherited from the host; only the painted values transition here. */
export const paintTransition = {
  ...timing,
  transitionProperty: "fill, stroke, opacity"
} satisfies CSSProperties

export const overlayMotionClass = "phreshos-ui-overlay"

const stylesheet = `
:root { --phreshos-ui-motion-duration: 160ms; }

.phreshos-ui-overlay { --phreshos-ui-overlay-x: 0px; --phreshos-ui-overlay-y: -4px; }
.phreshos-ui-overlay[data-placement="top"] { --phreshos-ui-overlay-y: 4px; }
.phreshos-ui-overlay[data-placement="left"] { --phreshos-ui-overlay-x: 4px; --phreshos-ui-overlay-y: 0px; }
.phreshos-ui-overlay[data-placement="right"] { --phreshos-ui-overlay-x: -4px; --phreshos-ui-overlay-y: 0px; }
.phreshos-ui-overlay[data-entering] {
  animation: phreshos-ui-overlay-enter var(--phreshos-ui-motion-duration, 160ms) ease-out both;
}
.phreshos-ui-overlay[data-exiting] {
  animation: phreshos-ui-overlay-enter var(--phreshos-ui-motion-duration, 160ms) ease-out reverse both;
  pointer-events: none;
}
@keyframes phreshos-ui-overlay-enter {
  from { translate: var(--phreshos-ui-overlay-x) var(--phreshos-ui-overlay-y); }
  to { translate: 0 0; }
}
@media (prefers-reduced-motion: reduce) {
  :root { --phreshos-ui-motion-duration: 0ms; }
  .phreshos-ui-overlay[data-entering], .phreshos-ui-overlay[data-exiting] { animation: none; }
}
`

/** React hoists and deduplicates this stylesheet, including nested providers and portals. */
export default function MotionStyle() {
  return <style href="phreshos-react-ui-motion" precedence="phreshos">{stylesheet}</style>
}
