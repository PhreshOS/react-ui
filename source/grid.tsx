import { forwardRef } from "react"
import type { ComponentPropsWithoutRef, CSSProperties } from "react"
import { alignment, justification, resolveGap, tracks } from "./layout.js"
import type { LayoutAlignment, LayoutGap, LayoutJustification } from "./layout.js"
import { useAppearanceIfAvailable } from "./appearance-provider.js"

/** Properties accepted by the Grid layout primitive. */
export interface GridProps extends ComponentPropsWithoutRef<"div"> {
  /** Equal-width column count or native CSS column-track expression. */
  readonly columns?: number | string

  /** Equal-height row count or native CSS row-track expression. */
  readonly rows?: number | string

  /** Automatic placement direction. */
  readonly flow?: CSSProperties["gridAutoFlow"]

  /** Cross-axis alignment of items inside their grid areas. */
  readonly align?: LayoutAlignment

  /** Distribution of the grid tracks along the inline axis. */
  readonly justify?: LayoutJustification

  /** Space between rows and columns. Numbers are pixels. */
  readonly gap?: LayoutGap

  /** Uses `inline-grid` instead of `grid`. */
  readonly inline?: boolean
}

/** A predictable CSS Grid container with no visual appearance of its own. */
export const Grid = forwardRef<HTMLDivElement, GridProps>(function Grid(
  { align, columns, flow, gap, inline = false, justify, rows, style, ...properties },
  ref
) {
  const appearance = useAppearanceIfAvailable()

  return <div
    {...properties}
    ref={ref}
    style={{
      ...style,
      display: inline ? "inline-grid" : "grid",
      alignItems: alignment(align) ?? style?.alignItems,
      gap: gap === undefined ? style?.gap : resolveGap(gap, appearance),
      gridAutoFlow: flow ?? style?.gridAutoFlow,
      gridTemplateColumns: tracks(columns, "columns") ?? style?.gridTemplateColumns,
      gridTemplateRows: tracks(rows, "rows") ?? style?.gridTemplateRows,
      justifyContent: justification(justify) ?? style?.justifyContent
    }}
  />
})
