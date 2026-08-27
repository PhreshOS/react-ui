import { forwardRef } from "react"
import type { ComponentPropsWithoutRef } from "react"
import { alignment, justification, resolveGap } from "./layout.js"
import type { LayoutAlignment, LayoutGap, LayoutJustification } from "./layout.js"
import { useAppearanceIfAvailable } from "./appearance-provider.js"

/** Properties accepted by the Flex layout primitive. */
export interface FlexProps extends ComponentPropsWithoutRef<"div"> {
  /** Main-axis direction. The browser default is `row`. */
  readonly direction?: "row" | "row-reverse" | "column" | "column-reverse"

  /** Cross-axis alignment of the children. */
  readonly align?: LayoutAlignment

  /** Distribution of children along the main axis. */
  readonly justify?: LayoutJustification

  /** Space between children. Numbers are pixels. */
  readonly gap?: LayoutGap

  /** Enables wrapping, or reverses the wrapped cross-axis order. */
  readonly wrap?: boolean | "reverse"

  /** Uses `inline-flex` instead of `flex`. */
  readonly inline?: boolean
}

/** A predictable Flexbox container with no visual appearance of its own. */
export const Flex = forwardRef<HTMLDivElement, FlexProps>(function Flex(
  { align, direction, gap, inline = false, justify, style, wrap, ...properties },
  ref
) {
  const appearance = useAppearanceIfAvailable()

  return <div
    {...properties}
    ref={ref}
    style={{
      ...style,
      display: inline ? "inline-flex" : "flex",
      alignItems: alignment(align) ?? style?.alignItems,
      flexDirection: direction ?? style?.flexDirection,
      flexWrap: wrap === undefined ? style?.flexWrap : wrap === "reverse" ? "wrap-reverse" : wrap ? "wrap" : "nowrap",
      gap: gap === undefined ? style?.gap : resolveGap(gap, appearance),
      justifyContent: justification(justify) ?? style?.justifyContent
    }}
  />
})
