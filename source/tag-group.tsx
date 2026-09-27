import { createContext, forwardRef, useContext } from "react"
import type { CSSProperties, ReactNode } from "react"
import { Tag as AriaTag, TagGroup as AriaTagGroup, TagList } from "react-aria-components"
import type { TagGroupProps as AriaTagGroupProps, TagProps as AriaTagProps, TagRenderProps } from "react-aria-components"
import { X } from "lucide-react"
import { controlFontWeight, relativeFontSize, useControlMetrics, type ControlMetrics, type FieldProps } from "./control/control.js"
import { FieldButton } from "./control/field-button.js"
import { FieldFeedback, FieldLabel, fieldStyle } from "./control/field.js"
import { iconProps } from "./control/icon.js"
import { selectionColor } from "./control/item.js"
import { surfaceRender } from "./control/surface-render.js"
import { colorLevel, resolveColor, type Color } from "./foundation/color.js"
import type { ScaleLevel } from "./foundation/scale.js"

type TagContext = Readonly<{ metrics: ControlMetrics, color: Color, size: ScaleLevel }>

const TagGroupContext = createContext<TagContext | null>(null)

/** Tags sit one control step below the size of their group, like Badges. */
const smaller: Readonly<Record<ScaleLevel, ScaleLevel>> = Object.freeze({ xsmall: "xsmall", small: "xsmall", medium: "small", large: "medium", xlarge: "large" })

export interface TagGroupProps extends Omit<AriaTagGroupProps, "className" | "style" | "children">, Omit<FieldProps, "required" | "invalid"> {
  readonly children?: ReactNode
  /** The paint of every Tag, in its subtle level; selection uses the selection color. */
  readonly color?: Color
  readonly size?: ScaleLevel
  readonly className?: string
  readonly style?: CSSProperties
}

/**
 * A set of short labels, such as applied filters. Tags can be selected like
 * collection items, and with `onRemove` each one gains a remove button.
 */
const TagGroupRoot = forwardRef<HTMLDivElement, TagGroupProps>(function TagGroup({
  label, description, errorMessage, children, color = "default", size = "medium", style, ...properties
}, ref) {
  const group = useControlMetrics(size)
  const metrics = useControlMetrics(smaller[size])

  return <TagGroupContext.Provider value={{ metrics, color, size }}>
    <AriaTagGroup {...properties} ref={ref} style={fieldStyle(group, style)}>
      <FieldLabel label={label} />
      <TagList style={{ display: "flex", flexWrap: "wrap", gap: group.gap }}>{children}</TagList>
      <FieldFeedback metrics={group} description={description} errorMessage={errorMessage} />
    </AriaTagGroup>
  </TagGroupContext.Provider>
})

export interface TagGroupTagProps extends Omit<AriaTagProps, "className" | "style" | "children"> {
  readonly children?: ReactNode
}

function TagGroupTag({ children, ...properties }: TagGroupTagProps) {
  const context = useContext(TagGroupContext)
  if (context === null) throw new Error("TagGroup.Tag must be inside TagGroup")
  const { metrics, color, size } = context
  const { colors } = metrics.visual
  const base = resolveColor(color, colors)

  return <AriaTag
    {...properties}
    textValue={properties.textValue ?? (typeof children === "string" ? children : undefined)}
    render={surfaceRender<TagRenderProps>("div", state => ({
      color: state.isSelected ? selectionColor(base, colors) : colorLevel(base, "subtle", colors),
      depth: "flat",
      radius: "full",
      interaction: { hovered: state.isHovered, pressed: state.isPressed, focusVisible: state.isFocusVisible, disabled: state.isDisabled }
    }))}
    style={state => ({
      display: "inline-flex",
      alignItems: "center",
      gap: metrics.gap / 2,
      height: metrics.height,
      paddingInlineStart: metrics.inset,
      paddingInlineEnd: state.allowsRemoving ? 4 : metrics.inset,
      boxSizing: "border-box",
      // The group root already applies its own text level.
      fontSize: relativeFontSize(smaller[size], size),
      fontWeight: controlFontWeight,
      whiteSpace: "nowrap",
      cursor: state.selectionMode === "none" ? "default" : "pointer",
      outlineOffset: -1
    })}
  >{state => <>
    {children}
    {state.allowsRemoving && <FieldButton slot="remove" metrics={metrics} aria-label="Remove">
      <X {...iconProps(Math.round(metrics.height / 2))} />
    </FieldButton>}
  </>}</AriaTag>
}

export const TagGroup = Object.assign(TagGroupRoot, { Tag: TagGroupTag })
