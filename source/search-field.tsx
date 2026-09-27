import { forwardRef } from "react"
import { Group, Input as AriaInput, SearchField as AriaSearchField } from "react-aria-components"
import type { GroupRenderProps, SearchFieldProps as AriaSearchFieldProps } from "react-aria-components"
import { Search, X } from "lucide-react"
import { controlOpacity, useControlMetrics, type ControlOverrides, type ControlProps, type FieldProps } from "./control/control.js"
import { FieldButton } from "./control/field-button.js"
import { FieldFeedback, FieldLabel, fieldStyle } from "./control/field.js"
import { iconProps } from "./control/icon.js"
import { surfaceRender } from "./control/surface-render.js"
import { nativeTextStyle } from "./control/text-control.js"
import MotionStyle, { textControlClass } from "./foundation/motion-style.js"
import type { RadiusProps } from "./foundation/radius.js"
import type { MaterialOverrides } from "./surface/material-options.js"
import { dimmedClass } from "./surface/surface.js"

export interface SearchFieldProps extends Omit<AriaSearchFieldProps, ControlOverrides | "className" | "style">, ControlProps, FieldProps, RadiusProps, MaterialOverrides {
  readonly placeholder?: string
  readonly readOnly?: boolean
}

/**
 * A text field for searching. It leads with a search mark, and a clear button
 * appears once it holds text; Escape clears it too, and Enter calls `onSubmit`.
 */
export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField({
  label, description, errorMessage, disabled, readOnly, required, invalid,
  size, color = "background", radius, style, className, placeholder, material, ...properties
}, ref) {
  const metrics = useControlMetrics(size, radius)
  const icon = Math.round(metrics.height / 2)

  return <AriaSearchField {...properties} className={dimmedClass(disabled ?? false, className)} isDisabled={disabled} isReadOnly={readOnly}
    isRequired={required} isInvalid={invalid} style={fieldStyle(metrics, style)}>
    {field => <>
      <MotionStyle />
      <FieldLabel label={label} />
      <Group
        render={surfaceRender<GroupRenderProps>("div", group => ({
          color,
          depth: "recessed",
          material,
          radius: metrics.radius,
          interaction: { hovered: group.isHovered, focusVisible: group.isFocusWithin, invalid: group.isInvalid, disabled: group.isDisabled }
        }))}
        style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr) auto", alignItems: "center", minWidth: 0, height: metrics.height, paddingInlineEnd: 4 }}
      >
        <Search {...iconProps(icon)} style={{ marginInlineStart: metrics.inset, opacity: controlOpacity.placeholder }} />
        <AriaInput ref={ref} placeholder={placeholder} className={textControlClass}
          style={{ ...nativeTextStyle(metrics, false), paddingInlineStart: metrics.gap, WebkitAppearance: "none" }} />
        {/* Inside a SearchField, a button clears the field. */}
        <FieldButton metrics={metrics} aria-label="Clear search" style={{ visibility: field.isEmpty ? "hidden" : "visible" }}>
          <X {...iconProps(icon)} />
        </FieldButton>
      </Group>
      <FieldFeedback metrics={metrics} description={description} errorMessage={errorMessage} />
    </>}
  </AriaSearchField>
})
