import { useEffect, useState, type CSSProperties, type ReactNode } from "react"
import { controlFontSizes, controlFontWeight } from "./control/control.js"
import MotionStyle, { overlayTransition } from "./foundation/motion-style.js"
import { scale } from "./foundation/scale.js"
import { useVisual } from "./foundation/visual.js"
import { ScrollArea } from "./scroll-area.js"
import { Surface } from "./surface/surface.js"

export interface DrawerProps {
  readonly open: boolean
  /** Called for a press outside the Drawer or for Escape. */
  readonly onClose: () => void
  /** Shown at its top, such as the name of what it belongs to. */
  readonly title?: ReactNode
  readonly "aria-label"?: string
  readonly className?: string
  readonly style?: CSSProperties
  readonly children: ReactNode
}

/**
 * A narrow layout's sidebar, over its content from the start side, such as the navigation a narrow
 * window gives up to its content. It is placed in its nearest positioned container. A press
 * outside or Escape closes it. It slides in and back out along the same path, timed by the
 * motion of a change in place, the way out its own animation so its end is seen; without motion it
 * simply shows and goes. Only its position moves:
 * fading it would switch off the blur it draws of what is behind it. The surface itself never
 * scrolls, so its material stays behind all of it; what it holds scrolls inside it.
 */
export function Drawer({ open, onClose, title, className, style, children, ...properties }: DrawerProps) {
  const visual = useVisual()
  const animated = visual.duration > 0
  const inset = scale(visual.spacing, "small")
  // It stays while it slides out, and leaves once the slide ends.
  const [present, setPresent] = useState(open)

  useEffect(() => { if (open) setPresent(true); else if (!animated) setPresent(false) }, [open, animated])

  useEffect(() => {
    if (!open) return
    // Escape closes the Drawer alone, not a surface that holds it.
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); onClose() } }
    addEventListener("keydown", close, true)
    return () => removeEventListener("keydown", close, true)
  }, [open, onClose])

  if (!present) return null

  return <>
    <MotionStyle />
    {open && <div data-drawer-scrim="" style={{ position: "absolute", inset: 0, zIndex: 10 }} onPointerDown={onClose} />}
    <Surface {...properties} data-drawer="" data-state={animated ? open ? "opening" : "closing" : undefined}
      material="full" className={["phreshos-ui-drawer", className].filter(Boolean).join(" ")}
      onAnimationEnd={() => { if (!open) setPresent(false) }}
      style={{
        ...overlayTransition(visual),
        position: "absolute",
        insetBlock: inset,
        insetInlineStart: inset,
        zIndex: 11,
        boxSizing: "border-box",
        width: `min(${visual.spacing * 20}px, calc(100% - ${visual.spacing * 4}px))`,
        padding: inset,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        ...style
      }}>
      {title != null && <div style={{ flex: "none", padding: `${inset}px ${inset}px ${visual.spacing}px`, fontSize: controlFontSizes.xlarge, fontWeight: controlFontWeight }}>{title}</div>}
      <ScrollArea style={{ flex: "1 1 auto", minHeight: 0 }}>{children}</ScrollArea>
    </Surface>
  </>
}
