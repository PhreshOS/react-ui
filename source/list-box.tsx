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
  ListBoxProps as AriaListBoxProps,
  ListBoxSectionProps as AriaListBoxSectionProps,
  Selection
} from "react-aria-components"
import { controlFontWeight, controlOpacity, useControlTheme } from "./control.js"
import type { ControlColor, ControlTheme } from "./control.js"
import type { RadiusProps } from "./radius.js"
import type { ScaleLevel } from "./scale.js"
import { resolveDirection, useDirection } from "./direction.js"
import {
  multipleSelection,
  singleSelection,
  toAriaSelection,
  type MultipleStringSelection,
  type MultipleStringSelectionProps,
  type SingleStringSelectionProps
} from "./selection.js"
import { AriaDirectionBoundary } from "./aria-direction.js"

type ListBoxTheme = Readonly<{
  color?: ControlColor
  radius: RadiusProps["radius"]
  size: ScaleLevel
  theme: ControlTheme
}>

const ListBoxThemeContext = createContext<ListBoxTheme | null>(null)

type ListBoxRootBaseProps<T extends object> = Omit<
  AriaListBoxProps<T>,
  "className" | "defaultSelectedKeys" | "disabledKeys" | "onSelectionChange" | "selectedKeys" | "selectionMode" | "style"
> & RadiusProps & Readonly<{
  className?: string
  color?: ControlColor
  disabledValues?: readonly string[]
  size?: ScaleLevel
  style?: CSSProperties
}>

export type ListBoxSingleSelectionProps = SingleStringSelectionProps & Readonly<{
  selectionMode?: "single"
}>

export type ListBoxMultipleValue = MultipleStringSelection

export type ListBoxMultipleSelectionProps = MultipleStringSelectionProps & Readonly<{
  selectionMode: "multiple"
}>

/** Properties accepted by the selectable collection. Single selection is the default. */
export type ListBoxRootProps<T extends object = object> = ListBoxRootBaseProps<T>
  & (ListBoxSingleSelectionProps | ListBoxMultipleSelectionProps)

const ListBoxRootImplementation = forwardRef(function ListBoxRoot<T extends object = object>(
  properties: ListBoxRootProps<T>,
  ref: ForwardedRef<HTMLDivElement>
) {
  const {
    className,
    color,
    defaultValue,
    disabledValues,
    onChange,
    radius = "medium",
    selectionMode = "single",
    shouldFocusOnHover = false,
    size = "medium",
    style,
    value,
    ...native
  } = properties
  const theme = useControlTheme({ color, radius, size })
  const context = useMemo(() => ({ color, radius, size, theme }), [color, radius, size, theme])
  const direction = resolveDirection(native.dir, useDirection())
  const selection = selectionProperties(properties)

  return <ListBoxThemeContext.Provider value={context}>
    <AriaDirectionBoundary direction={direction}><AriaListBox
      {...native}
      {...selection}
      ref={ref}
      dir={direction}
      selectionMode={selectionMode}
      shouldFocusOnHover={shouldFocusOnHover}
      className={className}
      style={{
        display: "grid",
        gap: theme.gap,
        minWidth: 0,
        padding: theme.gap,
        boxSizing: "border-box",
        outline: "none",
        fontFamily: "inherit",
        fontSize: theme.fontSize,
        ...style
      }}
    /></AriaDirectionBoundary>
  </ListBoxThemeContext.Provider>
})

export type ListBoxRootComponent = <T extends object = object>(
  properties: ListBoxRootProps<T> & RefAttributes<HTMLDivElement>
) => ReactElement | null

export const ListBoxRoot = ListBoxRootImplementation as ListBoxRootComponent

function selectionProperties<T extends object>(properties: ListBoxRootProps<T>) {
  const selectedKeys = toAriaSelection(properties.value)
  const defaultSelectedKeys = toAriaSelection(properties.defaultValue)
  const disabledKeys = properties.disabledValues
  const onSelectionChange = properties.onChange == null
    ? undefined
    : (selection: Selection) => {
        if (properties.selectionMode === "multiple") {
          properties.onChange?.(multipleSelection(selection))
          return
        }

        properties.onChange?.(singleSelection(selection))
      }

  return {
    ...(selectedKeys !== undefined ? { selectedKeys } : {}),
    ...(defaultSelectedKeys !== undefined ? { defaultSelectedKeys } : {}),
    ...(disabledKeys !== undefined ? { disabledKeys } : {}),
    ...(onSelectionChange !== undefined ? { onSelectionChange } : {})
  }
}

export interface ListBoxItemProps<T = object> extends Omit<AriaListBoxItemProps<T>, "className" | "id" | "isDisabled" | "style"> {
  readonly className?: string
  readonly color?: ControlColor
  readonly disabled?: boolean
  readonly id: string
  readonly style?: CSSProperties
}

const ListBoxItemImplementation = forwardRef(function ListBoxItem<T = object>(
  { children, className, color, disabled = false, style, ...properties }: ListBoxItemProps<T>,
  ref: ForwardedRef<HTMLDivElement>
) {
  const inherited = useContext(ListBoxThemeContext)
  const item = {
    children,
    className,
    disabled,
    properties: {
      ...properties,
      textValue: properties.textValue ?? (typeof children === "string" ? children : undefined)
    },
    ref,
    style
  }

  return inherited != null && color === undefined
    ? <ListBoxItemView {...item} theme={inherited.theme} />
    : <ResolvedListBoxItem {...item} color={color ?? inherited?.color} radius={inherited?.radius} size={inherited?.size} />
})

function ResolvedListBoxItem<T>({ color, radius, size, ...properties }: Readonly<{
  color?: ControlColor
  radius?: RadiusProps["radius"]
  size?: ScaleLevel
}> & ListBoxItemViewProps<T>) {
  return <ListBoxItemView {...properties} theme={useControlTheme({ color, radius, size })} />
}

type ListBoxItemViewProps<T> = Readonly<{
  children: ListBoxItemProps<T>["children"]
  className?: string
  disabled: boolean
  properties: Omit<ListBoxItemProps<T>, "children" | "className" | "color" | "disabled" | "style">
  ref: ForwardedRef<HTMLDivElement>
  style?: CSSProperties
}>

function ListBoxItemView<T>({ children, className, disabled, properties, ref, style, theme }: ListBoxItemViewProps<T> & Readonly<{ theme: ControlTheme }>) {
  return <AriaListBoxItem
    {...properties}
    ref={ref}
    className={className}
    isDisabled={disabled}
    style={state => ({
      ...theme.transition,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: theme.gap,
      minWidth: 0,
      minHeight: theme.height,
      paddingInline: Math.max(8, theme.spacing),
      boxSizing: "border-box",
      borderRadius: theme.radius,
      outline: state.isFocusVisible && !state.isSelected ? `1px solid ${theme.focusColor}` : "none",
      outlineOffset: 1,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? controlOpacity.disabled : 1,
      userSelect: "none",
      ...(state.isSelected
        ? state.isPressed
          ? theme.paints.palette.pressed
          : state.isHovered
            ? theme.paints.palette.hover
            : theme.paints.palette.rest
        : state.isHovered
          ? theme.paints.subtle.hover
          : { background: "transparent", color: "inherit" }),
      ...style
    })}
  >{state => <>
    {typeof children === "function" ? children(state) : children}
    <span aria-hidden="true" style={{ flexShrink: 0, width: "1em", textAlign: "center" }}>{state.isSelected ? "✓" : null}</span>
  </>}</AriaListBoxItem>
}

export type ListBoxItemComponent = <T = object>(
  properties: ListBoxItemProps<T> & RefAttributes<HTMLDivElement>
) => ReactElement | null

export const ListBoxItem = ListBoxItemImplementation as ListBoxItemComponent

export interface ListBoxSectionProps<T extends object = object> extends Omit<AriaListBoxSectionProps<T>, "className" | "style"> {
  readonly className?: string
  readonly style?: CSSProperties
}

const ListBoxSectionImplementation = forwardRef(function ListBoxSection<T extends object = object>(
  { className, style, ...properties }: ListBoxSectionProps<T>,
  ref: ForwardedRef<HTMLElement>
) {
  const theme = useListBoxTheme()

  return <AriaListBoxSection
    {...properties}
    ref={ref}
    className={className}
    style={{
      display: "grid",
      gap: theme.gap,
      minWidth: 0,
      ...style
    }}
  />
})

export type ListBoxSectionComponent = <T extends object = object>(
  properties: ListBoxSectionProps<T> & RefAttributes<HTMLElement>
) => ReactElement | null

export const ListBoxSection = ListBoxSectionImplementation as ListBoxSectionComponent

export type ListBoxHeaderProps = AriaHeaderProps

export const ListBoxHeader = forwardRef<HTMLElement, ListBoxHeaderProps>(function ListBoxHeader({ style, ...properties }, ref) {
  const theme = useListBoxTheme()

  return <AriaHeader
    {...properties}
    ref={ref}
    style={{
      paddingInline: Math.max(8, theme.spacing),
      paddingBlock: theme.gap,
      fontWeight: controlFontWeight,
      opacity: controlOpacity.secondary,
      ...style
    }}
  />
})

function useListBoxTheme() {
  const inherited = useContext(ListBoxThemeContext)
  if (inherited == null) throw new Error("ListBox parts must be used inside ListBox")
  return inherited.theme
}

/** A selectable collection whose items and groups remain independently composable. */
export const ListBox = Object.assign(ListBoxRoot, {
  Item: ListBoxItem,
  Section: ListBoxSection,
  Header: ListBoxHeader
})

export type ListBoxProps<T extends object = object> = ListBoxRootProps<T>
