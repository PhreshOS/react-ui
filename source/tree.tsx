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
  TreeItemContentProps as AriaTreeItemContentProps,
  TreeItemProps as AriaTreeItemProps,
  TreeProps as AriaTreeProps
} from "react-aria-components"
import { proportionalRadius, transition, useControlMetrics, type ControlMetrics } from "./control/control.js"
import { itemPaint, itemStyle } from "./control/item.js"
import {
  ariaSelection,
  stringKey,
  stringKeys,
  type MultipleSelectionProps,
  type MultipleStringSelection,
  type NoSelectionProps,
  type SingleSelectionProps
} from "./control/selection.js"
import { AriaDirectionBoundary } from "./foundation/aria-direction.js"
import { colorOpacity, type Color } from "./foundation/color.js"
import { resolveDirection, useDirection, type Direction } from "./foundation/direction.js"
import type { RadiusProps } from "./foundation/radius.js"
import type { ScaleLevel } from "./foundation/scale.js"
import { dimmedClass } from "./surface/surface.js"
import { ChevronRight } from "lucide-react"
import { iconProps } from "./control/icon.js"

type TreeContext = Readonly<{ color: Color, direction: Direction, interactive: boolean, metrics: ControlMetrics, itemRadius: CSSProperties["borderRadius"] }>

const TreeStyleContext = createContext<TreeContext | null>(null)

type TreeRootBaseProps<T extends object> = Omit<
  AriaTreeProps<T>,
  | "className" | "defaultExpandedKeys" | "defaultSelectedKeys" | "disabledKeys" | "expandedKeys" | "onAction"
  | "onExpandedChange" | "onSelectionChange" | "selectedKeys" | "selectionMode" | "style"
  | "shouldSelectOnPressUp"
> & RadiusProps & Readonly<{
  className?: string
  /** Color laid beneath selected Items. */
  color?: Color
  defaultExpanded?: readonly string[]
  expanded?: readonly string[]
  onExpandedChange?: (values: readonly string[]) => void
  /** Runs with the value of the Item that was activated. */
  onAction?: (value: string) => void
  /** Whether an Item is selected when the press ends instead of when it starts. */
  selectOnPressUp?: boolean
  size?: ScaleLevel
  style?: CSSProperties
}>

export type TreeNoSelectionProps = NoSelectionProps
export type TreeSingleSelectionProps = SingleSelectionProps
export type TreeMultipleValue = MultipleStringSelection
export type TreeMultipleSelectionProps = MultipleSelectionProps

export type TreeRootProps<T extends object = object> = TreeRootBaseProps<T>
  & (TreeNoSelectionProps | TreeSingleSelectionProps | TreeMultipleSelectionProps)

const TreeRootImplementation = forwardRef(function Tree<T extends object = object>(
  properties: TreeRootProps<T>,
  ref: ForwardedRef<HTMLDivElement>
) {
  const {
    className, color = "primary", defaultExpanded, defaultValue: _defaultValue, expanded, onAction,
    onChange: _onChange, onExpandedChange, radius, selectOnPressUp, selectionMode = "none", size, style, value: _value, ...native
  } = properties
  const metrics = useControlMetrics(size, radius)
  // Items are controls: they take the control radius at their size.
  const itemRadius = metrics.radius
  const direction = resolveDirection(native.dir, useDirection())
  const context = useMemo<TreeContext>(
    () => ({ color, direction, interactive: selectionMode !== "none" || onAction != null, metrics, itemRadius }),
    [color, direction, metrics, itemRadius, onAction, selectionMode]
  )

  return <TreeStyleContext.Provider value={context}>
    <AriaDirectionBoundary direction={direction}><AriaTree
      {...native}
      shouldSelectOnPressUp={selectOnPressUp}
      {...ariaSelection(properties, "none")}
      {...(expanded !== undefined ? { expandedKeys: new Set(expanded) } : {})}
      {...(defaultExpanded !== undefined ? { defaultExpandedKeys: new Set(defaultExpanded) } : {})}
      {...(onExpandedChange !== undefined ? { onExpandedChange: (keys: Set<Key>) => onExpandedChange(stringKeys(keys)) } : {})}
      ref={ref}
      dir={direction}
      className={className}
      onAction={onAction == null ? undefined : key => onAction(stringKey(key))}
      style={{
        display: "grid",
        alignContent: "start",
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
  </TreeStyleContext.Provider>
})

export type TreeRootComponent = <T extends object = object>(
  properties: TreeRootProps<T> & RefAttributes<HTMLDivElement>
) => ReactElement | null

export interface TreeItemProps<T = object> extends Omit<AriaTreeItemProps<T>, "className" | "id" | "isDisabled" | "style" | "hasChildItems" | "allowsArrowNavigation"> {
  /** Identity of this Item within its Tree. */
  readonly id: string
  /** Whether arrow keys move between cells while focus is inside this one. */
  readonly arrowNavigation?: boolean
  /** Whether this Item can expand before its children have loaded. */
  readonly expandable?: boolean
  readonly className?: string
  readonly disabled?: boolean
  readonly style?: CSSProperties
}

/** Tree entries use the collection Item treatment as their own paint. */
const TreeItemImplementation = forwardRef(function TreeItem<T = object>(
  { arrowNavigation, className, disabled = false, expandable, onAction, style, ...properties }: TreeItemProps<T>,
  ref: ForwardedRef<HTMLDivElement>
) {
  const { color, interactive, itemRadius, metrics } = useTreeStyle()

  return <AriaTreeItem
    {...properties}
    allowsArrowNavigation={arrowNavigation}
    hasChildItems={expandable}
    ref={ref}
    className={state => dimmedClass(state.isDisabled, className ?? state.defaultClassName) ?? ""}
    isDisabled={disabled}
    onAction={onAction}
    style={state => {
      const responds = interactive || onAction != null || state.hasChildItems
      return {
        ...itemStyle(metrics, state.isDisabled),
        ...itemPaint(metrics.visual, color, {
          selected: state.isSelected,
          hovered: responds && state.isHovered,
          pressed: responds && state.isPressed,
          focusVisible: false,
          disabled: state.isDisabled
        }),
        paddingInlineStart: metrics.inset / 2 + Math.max(0, state.level - 1) * metrics.spacing,
        borderRadius: itemRadius,
        outline: `3px solid ${state.isFocusVisible ? colorOpacity(metrics.visual.colors.primary, 0.34) : "transparent"}`,
        outlineOffset: 1,
        cursor: state.isDisabled ? "not-allowed" : responds ? "pointer" : "default",
        ...style
      }
    }}
  />
})

export type TreeItemComponent = <T = object>(
  properties: TreeItemProps<T> & RefAttributes<HTMLDivElement>
) => ReactElement | null

export interface TreeContentProps extends AriaTreeItemContentProps {
  readonly children: AriaTreeItemContentProps["children"]
}

const TreeContent = forwardRef<Element, TreeContentProps>(function TreeContent({ children }, ref) {
  const { direction, metrics } = useTreeStyle()
  const box = Math.round(metrics.indicator)

  return <AriaTreeItemContent ref={ref}>
    {state => <>
      {state.hasChildItems
        ? <AriaButton slot="chevron" style={({ isFocusVisible }) => ({
          display: "inline-grid",
          flex: "0 0 auto",
          placeItems: "center",
          width: box,
          height: box,
          padding: 0,
          border: 0,
          borderRadius: proportionalRadius(metrics.visual, box),
          outline: `3px solid ${isFocusVisible ? colorOpacity(metrics.visual.colors.primary, 0.34) : "transparent"}`,
          background: "transparent",
          color: "inherit",
          cursor: state.isDisabled ? "not-allowed" : "pointer",
          font: "inherit"
        })}>
          <ChevronRight {...iconProps(14)} style={{ ...transition(metrics.visual, "rotate"), rotate: state.isExpanded ? "90deg" : direction === "rtl" ? "180deg" : "0deg" }} />
        </AriaButton>
        : <span aria-hidden="true" style={{ flex: `0 0 ${box}px` }} />}
      {/* A label may lead with an icon: its parts sit centered, a gap apart, as in Menu and Tabs. */}
      <span style={{ flex: "1 1 auto", minWidth: 0, display: "flex", alignItems: "center", gap: metrics.gap }}>
        {typeof children === "function" ? children(state) : children}
      </span>
    </>}
  </AriaTreeItemContent>
})

export type TreeCollectionProps<T extends object = object> = AriaCollectionProps<T>

function useTreeStyle() {
  const context = useContext(TreeStyleContext)
  if (context == null) throw new Error("Tree parts must be used inside Tree")
  return context
}

/** Hierarchical navigation with independently controlled expansion, selection, and actions. */
export const Tree = Object.assign(TreeRootImplementation as TreeRootComponent, {
  Item: TreeItemImplementation as TreeItemComponent,
  Content: TreeContent,
  Collection: AriaCollection
})

export type TreeProps<T extends object = object> = TreeRootProps<T>
