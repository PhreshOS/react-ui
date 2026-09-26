import { createContext, forwardRef, useContext, useMemo } from "react"
import type { CSSProperties, ReactElement, ReactNode } from "react"
import {
  Button as AriaButton,
  Disclosure as AriaDisclosure,
  DisclosurePanel as AriaDisclosurePanel,
  DisclosureStateContext
} from "react-aria-components"
import type {
  ButtonProps as AriaButtonProps,
  ButtonRenderProps,
  DisclosurePanelProps as AriaDisclosurePanelProps,
  DisclosureProps as AriaDisclosureProps
} from "react-aria-components"
import { transition, useControlMetrics, type ControlMetrics } from "./control/control.js"
import { surfaceRender } from "./control/surface-render.js"
import type { Color } from "./foundation/color.js"
import type { RadiusProps } from "./foundation/radius.js"
import type { ScaleLevel } from "./foundation/scale.js"
import { resolveSpacing, type Spacing } from "./foundation/spacing.js"
import { ChevronDown } from "lucide-react"
import { iconProps } from "./control/icon.js"

type DisclosureContext = Readonly<{ color: Color, metrics: ControlMetrics }>

const DisclosureStyleContext = createContext<DisclosureContext | null>(null)

export interface DisclosureRootProps extends Omit<
  AriaDisclosureProps,
  "children" | "className" | "defaultExpanded" | "isDisabled" | "isExpanded" | "onExpandedChange" | "style"
>, RadiusProps {
  readonly children?: ReactNode
  readonly className?: string
  /** Paint of the trigger. Transparent by default, so it only veils on interaction. */
  readonly color?: Color
  readonly defaultExpanded?: boolean
  readonly disabled?: boolean
  readonly expanded?: boolean
  readonly onExpandedChange?: (expanded: boolean) => void
  readonly size?: ScaleLevel
  readonly style?: CSSProperties
}

/** One independently expandable region. */
export const DisclosureRoot = forwardRef<HTMLDivElement, DisclosureRootProps>(function Disclosure({
  children, className, color = "transparent", defaultExpanded, disabled = false, expanded, onExpandedChange, radius, size, style, ...properties
}, ref) {
  const metrics = useControlMetrics(size, radius)
  const context = useMemo(() => ({ color, metrics }), [color, metrics])

  return <DisclosureStyleContext.Provider value={context}>
    <AriaDisclosure
      {...properties}
      {...(expanded === undefined ? {} : { isExpanded: expanded })}
      {...(defaultExpanded === undefined ? {} : { defaultExpanded })}
      ref={ref}
      className={className}
      isDisabled={disabled}
      onExpandedChange={onExpandedChange}
      style={{ display: "grid", minWidth: 0, fontFamily: "inherit", fontSize: metrics.fontSize, ...style }}
    >{children}</AriaDisclosure>
  </DisclosureStyleContext.Provider>
})

export interface DisclosureTriggerProps extends Omit<AriaButtonProps, "children" | "className" | "isDisabled" | "isPending" | "onPress" | "render" | "style"> {
  readonly children?: ReactNode
  readonly className?: string
  readonly style?: CSSProperties
}

/** The control that changes the Disclosure's expansion state. */
export const DisclosureTrigger = forwardRef<HTMLButtonElement, DisclosureTriggerProps>(function DisclosureTrigger(
  { children, className, style, ...properties },
  ref
) {
  const { color, metrics } = useDisclosureStyle()
  const disclosure = useDisclosureState()

  return <AriaButton
    {...properties}
    ref={ref}
    slot="trigger"
    className={className}
    render={surfaceRender<ButtonRenderProps>("button", state => ({
      color,
      radius: metrics.radius,
      shadow: false,
      interaction: { hovered: state.isHovered, pressed: state.isPressed, focusVisible: state.isFocusVisible, disabled: state.isDisabled }
    }))}
    style={{
      appearance: "none",
      display: "grid",
      gridTemplateColumns: "minmax(0, 1fr) auto",
      alignItems: "center",
      gap: metrics.gap,
      width: "100%",
      minWidth: 0,
      minHeight: metrics.height,
      paddingBlock: metrics.gap / 2,
      paddingInline: metrics.inset,
      boxSizing: "border-box",
      border: 0,
      background: "none",
      cursor: "pointer",
      font: "inherit",
      fontWeight: 500,
      lineHeight: 1.45,
      textAlign: "start",
      userSelect: "none",
      WebkitTapHighlightColor: "transparent",
      ...style
    }}
  >
    <span style={{ minWidth: 0 }}>{children}</span>
    <ChevronDown {...iconProps(14)} style={{ ...transition(metrics.visual, "rotate"), rotate: disclosure.isExpanded ? "180deg" : "0deg" }} />
  </AriaButton>
})

export interface DisclosureContentProps extends Omit<AriaDisclosurePanelProps, "className" | "style"> {
  /** Space around the revealed content. */
  readonly padding?: Spacing
  readonly className?: string
  readonly style?: CSSProperties
}

/** Content revealed by a Disclosure trigger. */
export const DisclosureContent = forwardRef<HTMLDivElement, DisclosureContentProps>(function DisclosureContent(
  { children, className, padding = "small", style, ...properties },
  ref
) {
  const { metrics } = useDisclosureStyle()
  const disclosure = useDisclosureState()

  return <AriaDisclosurePanel
    {...properties}
    ref={ref}
    className={className}
    style={{
      ...transition(metrics.visual, "height, opacity"),
      height: "var(--disclosure-panel-height)",
      overflow: "clip",
      opacity: disclosure.isExpanded ? 1 : 0,
      ...style
    }}
  >
    <div style={{ minHeight: 0, overflow: "hidden" }}>
      <div style={{ padding: resolveSpacing(padding, metrics.visual.spacing) }}>{children}</div>
    </div>
  </AriaDisclosurePanel>
})

function useDisclosureState() {
  const state = useContext(DisclosureStateContext)
  if (state == null) throw new Error("Disclosure parts must be used inside Disclosure")
  return state
}

function useDisclosureStyle() {
  const context = useContext(DisclosureStyleContext)
  if (context == null) throw new Error("Disclosure parts must be used inside Disclosure")
  return context
}

interface DisclosureComponent {
  (properties: DisclosureRootProps): ReactElement | null
  readonly Trigger: typeof DisclosureTrigger
  readonly Content: typeof DisclosureContent
}

export const Disclosure = Object.assign(DisclosureRoot, {
  Trigger: DisclosureTrigger,
  Content: DisclosureContent
}) as DisclosureComponent

export type DisclosureProps = DisclosureRootProps
