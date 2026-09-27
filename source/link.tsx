import { forwardRef } from "react"
import type { CSSProperties, ReactNode } from "react"
import { Link as AriaLink, type LinkProps as AriaLinkProps } from "react-aria-components"
import { controlOpacity, transition } from "./control/control.js"
import { colorLevel, colorOpacity, resolveColor, type Color } from "./foundation/color.js"
import { useVisual } from "./foundation/visual.js"
import { surfacePaint } from "./surface/surface.js"

export interface LinkProps extends Omit<AriaLinkProps, "children" | "className" | "style" | "isDisabled"> {
  readonly children?: ReactNode
  /** The link's color role. Its text takes the strong level, so it reads on the canvas. */
  readonly color?: Color
  readonly disabled?: boolean
  readonly className?: string
  readonly style?: CSSProperties
}

/**
 * A link inside text. Links inside the app go through the `navigate` given to
 * UIProvider, like a Button with an href. Its underline rests at the
 * placeholder strength and fills in on hover; focus draws the same ring as
 * every other control.
 */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link({ color = "primary", disabled, className, style, children, ...properties }, ref) {
  const visual = useVisual()
  const paint = colorLevel(resolveColor(color, visual.colors), "strong", visual.colors)
  const ring = surfacePaint(visual, paint, "flat", "none", false, { focusVisible: true }).ring

  return <AriaLink
    {...properties}
    ref={ref}
    className={className}
    isDisabled={disabled}
    style={state => ({
      ...transition(visual, "text-decoration-color, outline-color"),
      color: paint,
      textDecorationLine: "underline",
      textDecorationThickness: "from-font",
      textUnderlineOffset: "0.2em",
      textDecorationColor: state.isHovered ? paint : colorOpacity(paint, controlOpacity.placeholder),
      borderRadius: "0.2em",
      outline: `3px solid ${state.isFocusVisible ? ring : "transparent"}`,
      outlineOffset: 1,
      cursor: state.isDisabled ? "not-allowed" : "pointer",
      opacity: state.isDisabled ? controlOpacity.secondary : undefined,
      ...style
    })}
  >{children}</AriaLink>
})
