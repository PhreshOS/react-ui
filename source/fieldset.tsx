import { forwardRef, useId } from "react"
import type { FieldsetHTMLAttributes, ReactNode } from "react"
import { controlFontSizes, controlFontWeight, controlOpacity, useControlMetrics } from "./control/control.js"
import { resolveSpacing } from "./foundation/spacing.js"

export interface FieldsetProps extends Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, "title"> {
  /** Names the group for everyone, including assistive technology. */
  readonly title: ReactNode
  readonly description?: ReactNode
  readonly children: ReactNode
}

/**
 * A titled group of related fields, such as one section of settings. Each
 * field keeps its own label; the group adds only its title, its description,
 * and the spacing between fields.
 */
export const Fieldset = forwardRef<HTMLFieldSetElement, FieldsetProps>(function Fieldset({ title, description, children, style, ...properties }, ref) {
  const metrics = useControlMetrics()
  const { spacing } = metrics.visual
  const titleId = useId()
  const descriptionId = useId()

  // The title names the group through aria-labelledby: a styled legend loses
  // its naming role in some browsers.
  return <fieldset
    aria-labelledby={titleId}
    aria-describedby={description != null ? descriptionId : undefined}
    {...properties}
    ref={ref}
    style={{
    display: "grid",
    gap: resolveSpacing("large", spacing),
    minWidth: 0,
    margin: 0,
    padding: 0,
    border: 0,
    ...style
  }}>
    <div style={{ display: "grid", gap: resolveSpacing("xsmall", spacing) }}>
      <span id={titleId} style={{ fontSize: controlFontSizes.large, fontWeight: controlFontWeight }}>{title}</span>
      {description != null && <span id={descriptionId} style={{ fontSize: controlFontSizes.medium, opacity: controlOpacity.secondary }}>{description}</span>}
    </div>
    <div style={{ display: "grid", gap: resolveSpacing("large", spacing), minWidth: 0 }}>{children}</div>
  </fieldset>
})
