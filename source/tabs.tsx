import { createContext, forwardRef, useContext, useMemo } from "react"
import type { CSSProperties, ForwardedRef, ReactElement, RefAttributes } from "react"
import {
  Tab as AriaTab,
  TabList as AriaTabList,
  TabPanel as AriaTabPanel,
  TabPanels as AriaTabPanels,
  Tabs as AriaTabs,
  TabListStateContext
} from "react-aria-components"
import type {
  TabListProps as AriaTabListProps,
  TabPanelProps as AriaTabPanelProps,
  TabPanelsProps as AriaTabPanelsProps,
  TabProps as AriaTabProps,
  TabsProps as AriaTabsProps
} from "react-aria-components"
import { useControlMetrics, type ControlMetrics } from "./control/control.js"
import { SelectionItemLabel, selectionItemStyle, selectionListStyle, SelectionTrack } from "./control/selection-track.js"
import { stringKey } from "./control/selection.js"
import { AriaDirectionBoundary } from "./foundation/aria-direction.js"
import { colorOpacity, type Color } from "./foundation/color.js"
import { resolveDirection, useDirection } from "./foundation/direction.js"
import type { RadiusProps } from "./foundation/radius.js"
import type { ScaleLevel } from "./foundation/scale.js"
import type { MaterialOverrides } from "./surface/material-options.js"
import { dimmedClass } from "./surface/surface.js"

type TabsContext = Readonly<{
  color: Color
  material: MaterialOverrides["material"]
  metrics: ControlMetrics
  orientation: "horizontal" | "vertical"
}>

const TabsStyleContext = createContext<TabsContext | null>(null)

export interface TabsRootProps extends Omit<
  AriaTabsProps,
  // A Tab is disabled on the Tab itself, like every collection Item.
  "className" | "defaultSelectedKey" | "disabledKeys" | "isDisabled" | "onSelectionChange" | "selectedKey" | "style"
>, RadiusProps, MaterialOverrides {
  readonly className?: string
  /** Paint of the raised selection. */
  readonly color?: Color
  readonly defaultValue?: string
  readonly disabled?: boolean
  readonly onChange?: (value: string) => void
  readonly size?: ScaleLevel
  readonly style?: CSSProperties
  readonly value?: string
}

/** Peer views with one selected Tab and its corresponding Panel. */
const TabsRoot = forwardRef<HTMLDivElement, TabsRootProps>(function Tabs({
  className, color = "default", defaultValue, disabled = false, onChange, orientation = "horizontal",
  material, radius, size, style, value, ...properties
}, ref) {
  const metrics = useControlMetrics(size, radius)
  const context = useMemo<TabsContext>(() => ({ color, material, metrics, orientation }), [color, material, metrics, orientation])
  const direction = resolveDirection(properties.dir, useDirection())

  return <TabsStyleContext.Provider value={context}>
    <AriaDirectionBoundary direction={direction}><AriaTabs
      {...properties}
      {...(value !== undefined ? { selectedKey: value } : {})}
      {...(defaultValue !== undefined ? { defaultSelectedKey: defaultValue } : {})}
      ref={ref}
      dir={direction}
      className={className}
      isDisabled={disabled}
      orientation={orientation}
      onSelectionChange={key => onChange?.(stringKey(key))}
      style={{
        display: "flex",
        flexDirection: orientation === "horizontal" ? "column" : "row",
        alignItems: "stretch",
        gap: metrics.gap,
        minWidth: 0,
        fontFamily: "inherit",
        fontSize: metrics.fontSize,
        ...style
      }}
    /></AriaDirectionBoundary>
  </TabsStyleContext.Provider>
})

export interface TabsListProps<T extends object = object> extends Omit<AriaTabListProps<T>, "className" | "style"> {
  readonly className?: string
  readonly style?: CSSProperties
}

/** The Tabs sit in a SelectionTrack; the selection slides to the selected Tab. */
const TabsListImplementation = forwardRef(function TabsList<T extends object = object>(
  { className, style, ...properties }: TabsListProps<T>,
  ref: ForwardedRef<HTMLDivElement>
) {
  const { color, material, metrics, orientation } = useTabsStyle()
  const selectedKey = useContext(TabListStateContext)?.selectedKey

  return <SelectionTrack metrics={metrics} color={color} material={material} orientation={orientation} selectedKey={selectedKey} className={className} style={style}>
    <AriaTabList {...properties} ref={ref} data-selection-list="" style={selectionListStyle(orientation)} />
  </SelectionTrack>
})

export type TabsListComponent = <T extends object = object>(
  properties: TabsListProps<T> & RefAttributes<HTMLDivElement>
) => ReactElement | null

export interface TabsTabProps extends Omit<AriaTabProps, "className" | "id" | "isDisabled" | "render" | "style"> {
  /** Identity shared with the corresponding Panel. */
  readonly id: string
  readonly className?: string
  readonly disabled?: boolean
  readonly style?: CSSProperties
}

const TabsTab = forwardRef<HTMLDivElement, TabsTabProps>(function TabsTab(
  { children, className, disabled = false, style, ...properties },
  ref
) {
  const { color, metrics, orientation } = useTabsStyle()

  return <AriaTab
    {...properties}
    ref={ref}
    className={state => dimmedClass(state.isDisabled, className ?? state.defaultClassName) ?? ""}
    isDisabled={disabled}
    style={state => ({ ...selectionItemStyle(metrics, color, orientation, state), ...style })}
  >{state => <SelectionItemLabel metrics={metrics} emphasized={state.isSelected || state.isHovered}>
    {typeof children === "function" ? children(state) : children}
  </SelectionItemLabel>}</AriaTab>
})

export type TabsPanelsProps<T extends object = object> = AriaTabPanelsProps<T>

export interface TabsPanelProps extends Omit<AriaTabPanelProps, "className" | "id" | "style" | "shouldForceMount"> {
  /** Identity shared with the corresponding Tab. */
  readonly id: string
  readonly className?: string
  /** Whether the Panel stays mounted while another Tab is selected. */
  readonly forceMount?: boolean
  readonly style?: CSSProperties
}

const TabsPanel = forwardRef<HTMLDivElement, TabsPanelProps>(function TabsPanel(
  { className, forceMount, style, ...properties },
  ref
) {
  const { metrics, orientation } = useTabsStyle()

  return <AriaTabPanel
    {...properties}
    shouldForceMount={forceMount}
    ref={ref}
    className={className}
    style={state => ({
      flex: orientation === "vertical" ? "1 1 auto" : undefined,
      minWidth: 0,
      borderRadius: metrics.radius,
      outline: `3px solid ${state.isFocusVisible ? colorOpacity(metrics.visual.colors.primary, 0.34) : "transparent"}`,
      outlineOffset: 1,
      ...style
    })}
  />
})

function useTabsStyle() {
  const context = useContext(TabsStyleContext)
  if (context == null) throw new Error("Tabs parts must be used inside Tabs")
  return context
}

/** Peer views with one selected Tab and one corresponding Panel. */
export const Tabs = Object.assign(TabsRoot, {
  List: TabsListImplementation as TabsListComponent,
  Tab: TabsTab,
  Panels: AriaTabPanels,
  Panel: TabsPanel
})

export type TabsProps = TabsRootProps
