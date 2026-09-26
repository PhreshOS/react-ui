import { createContext, forwardRef, useContext, useMemo } from "react"
import type { CSSProperties, ForwardedRef, ReactElement, RefAttributes } from "react"
import {
  Header as AriaHeader,
  ListBox as AriaListBox,
  ListBoxItem as AriaListBoxItem,
  ListBoxSection as AriaListBoxSection
} from "react-aria-components"
import type {
  HeaderProps as AriaHeaderProps,
  ListBoxItemProps as AriaListBoxItemProps,
  ListBoxItemRenderProps,
  ListBoxProps as AriaListBoxProps,
  ListBoxSectionProps as AriaListBoxSectionProps
} from "react-aria-components"
import { controlFontWeight, controlOpacity, useControlMetrics, type ControlMetrics } from "./control/control.js"
import { itemStyle, itemSurface, SelectionMark } from "./control/item.js"
import {
  ariaSelection,
  type MultipleSelectionProps,
  type MultipleStringSelection,
  type SingleStringSelectionProps
} from "./control/selection.js"
import { surfaceRender } from "./control/surface-render.js"
import { AriaDirectionBoundary } from "./foundation/aria-direction.js"
import type { Color } from "./foundation/color.js"
import { resolveDirection, useDirection } from "./foundation/direction.js"
import type { RadiusProps } from "./foundation/radius.js"
import type { ScaleLevel } from "./foundation/scale.js"

type ListBoxContext = Readonly<{ color: Color, metrics: ControlMetrics, itemRadius: CSSProperties["borderRadius"] }>

const ListBoxStyleContext = createContext<ListBoxContext | null>(null)

type ListBoxRootBaseProps<T extends object> = Omit<
  AriaListBoxProps<T>,
  | "className" | "defaultSelectedKeys" | "disabledKeys" | "onSelectionChange" | "selectedKeys" | "selectionMode" | "style"
  | "shouldFocusOnHover" | "shouldFocusWrap" | "shouldSelectOnPressUp"
> & RadiusProps & Readonly<{
  className?: string
  /** Color laid beneath selected Items. */
  color?: Color
  /** Whether pointing at an Item moves focus to it. */
  focusOnHover?: boolean
  /** Whether arrow keys wrap from the last Item to the first. */
  focusWrap?: boolean
  /** Whether an Item is selected when the press ends instead of when it starts. */
  selectOnPressUp?: boolean
  size?: ScaleLevel
  style?: CSSProperties
}>

export type ListBoxSingleSelectionProps = SingleStringSelectionProps & Readonly<{ selectionMode?: "single" }>

export type ListBoxMultipleValue = MultipleStringSelection

export type ListBoxMultipleSelectionProps = MultipleSelectionProps

/** A selectable collection. Single selection is the default. */
export type ListBoxRootProps<T extends object = object> = ListBoxRootBaseProps<T>
  & (ListBoxSingleSelectionProps | ListBoxMultipleSelectionProps)

const ListBoxRootImplementation = forwardRef(function ListBox<T extends object = object>(
  properties: ListBoxRootProps<T>,
  ref: ForwardedRef<HTMLDivElement>
) {
  const {
    className, color = "primary", defaultValue: _defaultValue, onChange: _onChange, radius,
    selectionMode: _selectionMode, focusOnHover = false, focusWrap, selectOnPressUp, size, style, value: _value, ...native
  } = properties
  const metrics = useControlMetrics(size, radius)
  // Items are controls: they take the control radius at their size.
  const itemRadius = metrics.radius
  const context = useMemo(() => ({ color, metrics, itemRadius }), [color, metrics, itemRadius])
  const direction = resolveDirection(native.dir, useDirection())

  return <ListBoxStyleContext.Provider value={context}>
    <AriaDirectionBoundary direction={direction}><AriaListBox
      {...native}
      {...ariaSelection(properties, "single")}
      ref={ref}
      dir={direction}
      shouldFocusOnHover={focusOnHover}
      shouldFocusWrap={focusWrap}
      shouldSelectOnPressUp={selectOnPressUp}
      className={className}
      style={{
        display: "grid",
        gap: 2,
        minWidth: 0,
        padding: metrics.listInset,
        boxSizing: "border-box",
        outline: "none",
        fontFamily: "inherit",
        fontSize: metrics.fontSize,
        ...style
      }}
    /></AriaDirectionBoundary>
  </ListBoxStyleContext.Provider>
})

export type ListBoxRootComponent = <T extends object = object>(
  properties: ListBoxRootProps<T> & RefAttributes<HTMLDivElement>
) => ReactElement | null

export interface ListBoxItemProps<T = object> extends Omit<AriaListBoxItemProps<T>, "className" | "id" | "isDisabled" | "render" | "style"> {
  /** Identity of this Item within its collection. */
  readonly id: string
  readonly className?: string
  /** Color laid beneath this Item when it is selected. */
  readonly color?: Color
  readonly disabled?: boolean
  readonly style?: CSSProperties
}

const ListBoxItemImplementation = forwardRef(function ListBoxItem<T = object>(
  { children, className, color, disabled = false, style, textValue, ...properties }: ListBoxItemProps<T>,
  ref: ForwardedRef<HTMLDivElement>
) {
  const inherited = useListBoxStyle()
  const itemColor = color ?? inherited.color
  const { metrics, itemRadius } = inherited

  return <AriaListBoxItem
    {...properties}
    ref={ref}
    textValue={textValue ?? (typeof children === "string" ? children : undefined)}
    className={className}
    isDisabled={disabled}
    render={surfaceRender<ListBoxItemRenderProps>("div", state => itemSurface(metrics.visual, itemColor, {
      selected: state.isSelected,
      hovered: state.isHovered,
      pressed: state.isPressed,
      focusVisible: state.isFocusVisible,
      disabled: state.isDisabled
    }, itemRadius))}
    style={{ ...itemStyle(metrics, disabled), ...style }}
  >{state => <>
    {typeof children === "function" ? children(state) : children}
    <SelectionMark visible={state.isSelected} />
  </>}</AriaListBoxItem>
})

export type ListBoxItemComponent = <T = object>(
  properties: ListBoxItemProps<T> & RefAttributes<HTMLDivElement>
) => ReactElement | null

export interface ListBoxSectionProps<T extends object = object> extends Omit<AriaListBoxSectionProps<T>, "className" | "style"> {
  readonly className?: string
  readonly style?: CSSProperties
}

const ListBoxSectionImplementation = forwardRef(function ListBoxSection<T extends object = object>(
  { className, style, ...properties }: ListBoxSectionProps<T>,
  ref: ForwardedRef<HTMLElement>
) {
  useListBoxStyle()
  return <AriaListBoxSection {...properties} ref={ref} className={className} style={{ display: "grid", gap: 2, minWidth: 0, ...style }} />
})

export type ListBoxSectionComponent = <T extends object = object>(
  properties: ListBoxSectionProps<T> & RefAttributes<HTMLElement>
) => ReactElement | null

export type ListBoxHeaderProps = AriaHeaderProps

const ListBoxHeader = forwardRef<HTMLElement, ListBoxHeaderProps>(function ListBoxHeader({ style, ...properties }, ref) {
  const { metrics } = useListBoxStyle()
  return <AriaHeader {...properties} ref={ref} style={collectionHeaderStyle(metrics, style)} />
})

/** Heading treatment shared by list and menu sections. */
export function collectionHeaderStyle(metrics: ControlMetrics, style?: CSSProperties): CSSProperties {
  return {
    paddingInline: metrics.inset,
    paddingBlock: metrics.gap,
    fontSize: "0.92em",
    fontWeight: controlFontWeight,
    opacity: controlOpacity.secondary,
    ...style
  }
}

function useListBoxStyle() {
  const context = useContext(ListBoxStyleContext)
  if (context == null) throw new Error("ListBox parts must be used inside ListBox")
  return context
}

/** A selectable collection whose Items and Sections remain independently composable. */
export const ListBox = Object.assign(ListBoxRootImplementation as ListBoxRootComponent, {
  Item: ListBoxItemImplementation as ListBoxItemComponent,
  Section: ListBoxSectionImplementation as ListBoxSectionComponent,
  Header: ListBoxHeader
})

export type ListBoxProps<T extends object = object> = ListBoxRootProps<T>
