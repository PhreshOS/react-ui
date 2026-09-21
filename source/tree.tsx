import { createContext, forwardRef, useContext, useMemo } from "react"
import type { CSSProperties, ForwardedRef, ReactElement, RefAttributes } from "react"
import {
  Button as AriaButton,
  Collection as AriaCollection,
  Tree as AriaTree,
  TreeItem as AriaTreeItem,
  TreeItemContent as AriaTreeItemContent
} from "react-aria-components"
import type {
  CollectionProps as AriaCollectionProps,
  Key,
  Selection,
  TreeItemContentProps as AriaTreeItemContentProps,
  TreeItemProps as AriaTreeItemProps,
  TreeProps as AriaTreeProps
} from "react-aria-components"
import { controlOpacity, useControlTheme } from "./control.js"
import type { ControlColor, ControlTheme } from "./control.js"
import { resolveDirection, useDirection } from "./direction.js"
import type { RadiusProps } from "./radius.js"
import type { ScaleLevel } from "./scale.js"
import {
  multipleSelection,
  singleSelection,
  stringKey,
  stringKeys,
  toAriaSelection,
  type MultipleStringSelection,
  type MultipleStringSelectionProps,
  type SingleStringSelectionProps
} from "./selection.js"
import { AriaDirectionBoundary } from "./aria-direction.js"

type TreeTheme = Readonly<{
  direction: "ltr" | "rtl"
  interactive: boolean
  theme: ControlTheme
}>

const TreeThemeContext = createContext<TreeTheme | null>(null)

type TreeRootBaseProps<T extends object> = Omit<
  AriaTreeProps<T>,
  | "className"
  | "defaultExpandedKeys"
  | "defaultSelectedKeys"
  | "disabledKeys"
  | "expandedKeys"
  | "onAction"
  | "onExpandedChange"
  | "onSelectionChange"
  | "selectedKeys"
  | "selectionMode"
  | "style"
> & RadiusProps & Readonly<{
  className?: string
  color?: ControlColor
  defaultExpanded?: readonly string[]
  disabledValues?: readonly string[]
  expanded?: readonly string[]
  onExpandedChange?: (values: readonly string[]) => void
  onItemAction?: (value: string) => void
  size?: ScaleLevel
  style?: CSSProperties
}>

export type TreeNoSelectionProps = Readonly<{
  selectionMode?: "none"
  value?: never
  defaultValue?: never
  onChange?: never
}>

export type TreeSingleSelectionProps = SingleStringSelectionProps & Readonly<{
  selectionMode: "single"
}>

export type TreeMultipleValue = MultipleStringSelection

export type TreeMultipleSelectionProps = MultipleStringSelectionProps & Readonly<{
  selectionMode: "multiple"
}>

export type TreeRootProps<T extends object = object> = TreeRootBaseProps<T>
  & (TreeNoSelectionProps | TreeSingleSelectionProps | TreeMultipleSelectionProps)

const TreeRootImplementation = forwardRef(function TreeRoot<T extends object = object>(
  properties: TreeRootProps<T>,
  ref: ForwardedRef<HTMLDivElement>
) {
  const {
    className,
    color,
    defaultExpanded,
    defaultValue,
    disabledValues,
    expanded,
    onChange,
    onExpandedChange,
    onItemAction,
    radius = "medium",
    selectionMode = "none",
    size = "medium",
    style,
    value,
    ...native
  } = properties
  const theme = useControlTheme({ color, radius, size })
  const direction = resolveDirection(native.dir, useDirection())
  const context = useMemo<TreeTheme>(
    () => ({ direction, interactive: selectionMode !== "none" || onItemAction != null, theme }),
    [direction, onItemAction, selectionMode, theme]
  )

  return <TreeThemeContext.Provider value={context}>
    <AriaDirectionBoundary direction={direction}><AriaTree
      {...native}
      {...selectionProperties(properties)}
      {...expansionProperties({ defaultExpanded, expanded, onExpandedChange })}
      ref={ref}
      dir={direction}
      className={className}
      disabledKeys={disabledValues}
      selectionMode={selectionMode}
      onAction={onItemAction == null ? undefined : key => onItemAction(stringKey(key))}
      style={{
        display: "grid",
        alignContent: "start",
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
  </TreeThemeContext.Provider>
})

export type TreeRootComponent = <T extends object = object>(
  properties: TreeRootProps<T> & RefAttributes<HTMLDivElement>
) => ReactElement | null

export const TreeRoot = TreeRootImplementation as TreeRootComponent

function selectionProperties<T extends object>(properties: TreeRootProps<T>) {
  const selectedKeys = toAriaSelection(properties.value)
  const defaultSelectedKeys = toAriaSelection(properties.defaultValue)
  const onSelectionChange = properties.onChange == null
    ? undefined
    : (selection: Selection) => {
        if (properties.selectionMode === "multiple") {
          properties.onChange?.(multipleSelection(selection))
          return
        }

        if (properties.selectionMode === "single") properties.onChange?.(singleSelection(selection))
      }

  return {
    ...(selectedKeys !== undefined ? { selectedKeys } : {}),
    ...(defaultSelectedKeys !== undefined ? { defaultSelectedKeys } : {}),
    ...(onSelectionChange !== undefined ? { onSelectionChange } : {})
  }
}

function expansionProperties({ defaultExpanded, expanded, onExpandedChange }: Pick<
  TreeRootBaseProps<object>,
  "defaultExpanded" | "expanded" | "onExpandedChange"
>) {
  return {
    ...(expanded !== undefined ? { expandedKeys: new Set(expanded) } : {}),
    ...(defaultExpanded !== undefined ? { defaultExpandedKeys: new Set(defaultExpanded) } : {}),
    ...(onExpandedChange !== undefined
      ? { onExpandedChange: (keys: Set<Key>) => onExpandedChange(stringKeys(keys)) }
      : {})
  }
}

export interface TreeItemProps<T = object> extends Omit<
  AriaTreeItemProps<T>,
  "className" | "id" | "isDisabled" | "style"
> {
  readonly className?: string
  readonly disabled?: boolean
  readonly id: string
  readonly style?: CSSProperties
}

const TreeItemImplementation = forwardRef(function TreeItem<T = object>(
  { className, disabled = false, onAction, style, ...properties }: TreeItemProps<T>,
  ref: ForwardedRef<HTMLDivElement>
) {
  const { interactive, theme } = useTreeTheme()

  return <AriaTreeItem
    {...properties}
    ref={ref}
    className={className}
    isDisabled={disabled}
    onAction={onAction}
    style={state => {
      const responds = interactive || onAction != null || state.hasChildItems

      return {
        ...theme.transition,
        display: "flex",
        alignItems: "center",
        gap: theme.gap,
        minWidth: 0,
        minHeight: theme.height,
        paddingBlock: 0,
        paddingInlineEnd: Math.max(8, theme.spacing),
        paddingInlineStart: Math.max(8, theme.spacing) + Math.max(0, state.level - 1) * theme.spacing,
        boxSizing: "border-box",
        borderRadius: theme.radius,
        outline: state.isFocusVisible ? `1px solid ${theme.focusColor}` : "none",
        outlineOffset: 1,
        cursor: disabled ? "not-allowed" : responds ? "pointer" : "default",
        opacity: disabled ? controlOpacity.disabled : 1,
        userSelect: "none",
        ...(state.isSelected
          ? state.isPressed
            ? theme.paints.palette.pressed
            : state.isHovered
              ? theme.paints.palette.hover
              : theme.paints.palette.rest
          : state.isHovered && responds
            ? theme.paints.subtle.hover
            : { background: "transparent", color: "inherit" }),
        ...style
      }
    }}
  />
})

export type TreeItemComponent = <T = object>(
  properties: TreeItemProps<T> & RefAttributes<HTMLDivElement>
) => ReactElement | null

export const TreeItem = TreeItemImplementation as TreeItemComponent

export interface TreeContentProps extends AriaTreeItemContentProps {
  readonly children: AriaTreeItemContentProps["children"]
}

export const TreeContent = forwardRef<Element, TreeContentProps>(function TreeContent(
  { children },
  ref
) {
  const { direction, theme } = useTreeTheme()

  return <AriaTreeItemContent ref={ref}>
    {state => <>
      {state.hasChildItems
        ? <AriaButton
            slot="chevron"
            style={({ isFocusVisible }) => ({
              ...theme.transition,
              appearance: "none",
              display: "inline-grid",
              flex: "0 0 auto",
              placeItems: "center",
              width: theme.indicatorSize,
              height: theme.indicatorSize,
              padding: 0,
              border: 0,
              borderRadius: theme.radius,
              outline: isFocusVisible ? `1px solid ${theme.focusColor}` : "none",
              outlineOffset: 1,
              background: "transparent",
              color: "inherit",
              cursor: state.isDisabled ? "not-allowed" : "pointer",
              font: "inherit"
            })}
          >
            <Chevron direction={direction} expanded={state.isExpanded} theme={theme} />
          </AriaButton>
        : <span aria-hidden="true" style={{ flex: `0 0 ${theme.indicatorSize}px`, width: theme.indicatorSize }} />}
      <span style={{ flex: "1 1 auto", minWidth: 0 }}>
        {typeof children === "function" ? children(state) : children}
      </span>
    </>}
  </AriaTreeItemContent>
})

function Chevron({ direction, expanded, theme }: Readonly<{
  direction: "ltr" | "rtl"
  expanded: boolean
  theme: ControlTheme
}>) {
  const collapsedRotation = direction === "rtl" ? 180 : 0

  return <svg
    aria-hidden="true"
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      ...theme.transition,
      transitionProperty: "transform",
      transform: `rotate(${expanded ? 90 : collapsedRotation}deg)`
    }}
  ><path d="m4 2 4 4-4 4" /></svg>
}

export type TreeCollectionProps<T extends object = object> = AriaCollectionProps<T>

export const TreeCollection = AriaCollection

/** Hierarchical navigation with independently controlled expansion, selection, and item actions. */
export const Tree = Object.assign(TreeRoot, {
  Item: TreeItem,
  Content: TreeContent,
  Collection: TreeCollection
})

export type TreeProps<T extends object = object> = TreeRootProps<T>

function useTreeTheme() {
  const value = useContext(TreeThemeContext)
  if (value == null) throw new Error("Tree parts must be used inside Tree")
  return value
}
