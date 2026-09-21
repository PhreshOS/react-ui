import { createContext, forwardRef, useContext, useId, useMemo } from "react"
import type { CSSProperties, ForwardedRef, ReactElement, RefAttributes } from "react"
import {
  Tab as AriaTab,
  TabList as AriaTabList,
  TabPanel as AriaTabPanel,
  TabPanels as AriaTabPanels,
  Tabs as AriaTabs
} from "react-aria-components"
import type {
  TabListProps as AriaTabListProps,
  TabPanelProps as AriaTabPanelProps,
  TabPanelsProps as AriaTabPanelsProps,
  TabProps as AriaTabProps,
  TabsProps as AriaTabsProps
} from "react-aria-components"
import { LayoutGroup, motion } from "motion/react"
import { AriaDirectionBoundary } from "./aria-direction.js"
import { controlOpacity, useControlTheme } from "./control.js"
import type { ControlColor, ControlTheme } from "./control.js"
import { resolveDirection, useDirection } from "./direction.js"
import type { RadiusProps } from "./radius.js"
import type { ScaleLevel } from "./scale.js"
import { stringKey } from "./selection.js"
import { Surface } from "./surface.js"

type TabsTheme = Readonly<{
  orientation: "horizontal" | "vertical"
  theme: ControlTheme
}>

const TabsThemeContext = createContext<TabsTheme | null>(null)

export interface TabsRootProps extends Omit<
  AriaTabsProps,
  "className" | "defaultSelectedKey" | "isDisabled" | "onSelectionChange" | "selectedKey" | "style"
>, RadiusProps {
  readonly className?: string
  readonly color?: ControlColor
  readonly defaultValue?: string
  readonly disabled?: boolean
  readonly onChange?: (value: string) => void
  readonly size?: ScaleLevel
  readonly style?: CSSProperties
  readonly value?: string
}

export const TabsRoot = forwardRef<HTMLDivElement, TabsRootProps>(function TabsRoot(
  {
    className,
    color,
    defaultValue,
    disabled = false,
    onChange,
    orientation = "horizontal",
    radius = "medium",
    size = "medium",
    style,
    value,
    ...properties
  },
  ref
) {
  const theme = useControlTheme({ color, radius, size })
  const context = useMemo<TabsTheme>(() => ({ orientation, theme }), [orientation, theme])
  const layoutGroup = useId()
  const direction = resolveDirection(properties.dir, useDirection())

  return <TabsThemeContext.Provider value={context}>
    <LayoutGroup id={layoutGroup}>
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
          gap: theme.gap,
          minWidth: 0,
          fontFamily: "inherit",
          fontSize: theme.fontSize,
          ...style
        }}
      /></AriaDirectionBoundary>
    </LayoutGroup>
  </TabsThemeContext.Provider>
})

export interface TabsListProps<T extends object = object> extends Omit<AriaTabListProps<T>, "className" | "style"> {
  readonly className?: string
  readonly style?: CSSProperties
}

const TabsListImplementation = forwardRef(function TabsList<T extends object = object>(
  { className, style, ...properties }: TabsListProps<T>,
  ref: ForwardedRef<HTMLDivElement>
) {
  const { orientation, theme } = useTabsTheme()

  return <AriaTabList
    {...properties}
    ref={ref}
    className={className}
    style={{
      display: "grid",
      gridAutoFlow: orientation === "horizontal" ? "column" : "row",
      gridAutoColumns: orientation === "horizontal" ? "minmax(0, 1fr)" : undefined,
      alignContent: "start",
      alignItems: "stretch",
      gap: Math.max(2, theme.gap / 2),
      minWidth: 0,
      width: orientation === "horizontal" ? "100%" : undefined,
      boxSizing: "border-box",
      padding: Math.max(2, theme.gap / 2),
      borderRadius: theme.radius,
      background: theme.paints.palette.rest.background,
      ...style
    }}
  />
})

export type TabsListComponent = <T extends object = object>(
  properties: TabsListProps<T> & RefAttributes<HTMLDivElement>
) => ReactElement | null

export const TabsList = TabsListImplementation as TabsListComponent

export interface TabsTabProps extends Omit<AriaTabProps, "className" | "id" | "isDisabled" | "style"> {
  readonly className?: string
  readonly disabled?: boolean
  readonly id: string
  readonly style?: CSSProperties
}

export const TabsTab = forwardRef<HTMLDivElement, TabsTabProps>(function TabsTab(
  { children, className, disabled = false, style, ...properties },
  ref
) {
  const { orientation, theme } = useTabsTheme()

  return <AriaTab
    {...properties}
    ref={ref}
    className={className}
    isDisabled={disabled}
    style={state => ({
      ...theme.transition,
      position: "relative",
      zIndex: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      minWidth: 0,
      minHeight: theme.height,
      paddingBlock: 0,
      paddingInline: Math.max(8, theme.spacing),
      boxSizing: "border-box",
      borderRadius: theme.radius,
      outline: state.isFocusVisible ? `1px solid ${theme.focusColor}` : "none",
      outlineOffset: 1,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? controlOpacity.disabled : 1,
      userSelect: "none",
      background: "transparent",
      color: theme.paints.palette.rest.color,
      ...(orientation === "vertical" ? { justifyContent: "start" } : {}),
      ...style
    })}
  >{state => <>
    {state.isSelected && <Surface
      as={motion.span}
      data-tabs-indicator=""
      aria-hidden="true"
      initial={false}
      layoutId="selection"
      color={theme.paints.palette.hover.background}
      transition={theme.motionTransition}
      style={{
        position: "absolute",
        zIndex: -1,
        inset: 0,
        boxSizing: "border-box",
        borderRadius: theme.radius,
        pointerEvents: "none"
      }}
    />}
    <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
      {typeof children === "function" ? children(state) : children}
    </span>
  </>}</AriaTab>
})

export type TabsPanelsProps<T extends object = object> = AriaTabPanelsProps<T>
export const TabsPanels = AriaTabPanels

export interface TabsPanelProps extends Omit<AriaTabPanelProps, "className" | "id" | "style"> {
  readonly className?: string
  readonly id: string
  readonly style?: CSSProperties
}

export const TabsPanel = forwardRef<HTMLDivElement, TabsPanelProps>(function TabsPanel(
  { className, style, ...properties },
  ref
) {
  const { orientation, theme } = useTabsTheme()

  return <AriaTabPanel
    {...properties}
    ref={ref}
    className={className}
    style={state => ({
      flex: orientation === "vertical" ? "1 1 auto" : undefined,
      minWidth: 0,
      outline: state.isFocusVisible ? `1px solid ${theme.focusColor}` : "none",
      outlineOffset: 1,
      ...style
    })}
  />
})

function useTabsTheme() {
  const value = useContext(TabsThemeContext)
  if (value == null) throw new Error("Tabs parts must be used inside Tabs")
  return value
}

/** Peer views with one selected tab and one corresponding panel. */
export const Tabs = Object.assign(TabsRoot, {
  List: TabsList,
  Tab: TabsTab,
  Panels: TabsPanels,
  Panel: TabsPanel
})

export type TabsProps = TabsRootProps
