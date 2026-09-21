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
  DisclosurePanelProps as AriaDisclosurePanelProps,
  DisclosureProps as AriaDisclosureProps
} from "react-aria-components"
import { useResolvedAppearance } from "./appearance-context.js"
import { controlOpacity, useControlTheme } from "./control.js"
import type { ControlColor, ControlTheme } from "./control.js"
import { transitionTiming } from "./motion-style.js"
import type { RadiusProps } from "./radius.js"
import type { ScaleLevel } from "./scale.js"
import { resolveSpacing, type Spacing } from "./spacing.js"

type DisclosureTheme = Readonly<{
  motion: CSSProperties
  theme: ControlTheme
}>

const DisclosureThemeContext = createContext<DisclosureTheme | null>(null)

export interface DisclosureRootProps extends Omit<
  AriaDisclosureProps,
  "children" | "className" | "defaultExpanded" | "isDisabled" | "isExpanded" | "onExpandedChange" | "style"
>, RadiusProps {
  readonly children?: ReactNode
  readonly className?: string
  readonly color?: ControlColor
  readonly defaultExpanded?: boolean
  readonly disabled?: boolean
  readonly expanded?: boolean
  readonly onChange?: (expanded: boolean) => void
  readonly size?: ScaleLevel
  readonly style?: CSSProperties
}

/** One independently expandable region. */
export const DisclosureRoot = forwardRef<HTMLDivElement, DisclosureRootProps>(function DisclosureRoot(
  {
    children,
    className,
    color,
    defaultExpanded,
    disabled = false,
    expanded,
    onChange,
    radius = "medium",
    size = "medium",
    style,
    ...properties
  },
  ref
) {
  const theme = useControlTheme({ color, radius, size })
  const resolved = useResolvedAppearance()
  const context = useMemo<DisclosureTheme>(() => ({
    motion: transitionTiming(resolved.transaction, resolved.preferences.animations),
    theme
  }), [resolved.preferences.animations, resolved.transaction, theme])

  return <DisclosureThemeContext.Provider value={context}>
    <AriaDisclosure
      {...properties}
      {...(expanded === undefined ? {} : { isExpanded: expanded })}
      {...(defaultExpanded === undefined ? {} : { defaultExpanded })}
      ref={ref}
      className={className}
      isDisabled={disabled}
      onExpandedChange={onChange}
      style={{
        display: "grid",
        minWidth: 0,
        fontFamily: "inherit",
        fontSize: theme.fontSize,
        ...style
      }}
    >{children}</AriaDisclosure>
  </DisclosureThemeContext.Provider>
})

export interface DisclosureTriggerProps extends Omit<
  AriaButtonProps,
  "children" | "className" | "isDisabled" | "onPress" | "style"
> {
  readonly children?: ReactNode
  readonly className?: string
  readonly style?: CSSProperties
}

/** The control that changes the Disclosure's expansion state. */
export const DisclosureTrigger = forwardRef<HTMLButtonElement, DisclosureTriggerProps>(function DisclosureTrigger(
  { children, className, style, ...properties },
  ref
) {
  const { motion, theme } = useDisclosureTheme()
  const disclosure = useDisclosureState()

  return <AriaButton
    {...properties}
    ref={ref}
    slot="trigger"
    className={className}
    style={state => ({
      ...theme.transition,
      appearance: "none",
      display: "grid",
      gridTemplateColumns: "minmax(0, 1fr) auto",
      alignItems: "center",
      gap: theme.gap,
      width: "100%",
      minWidth: 0,
      minHeight: theme.height,
      paddingBlock: theme.gap,
      paddingInline: Math.max(8, theme.spacing),
      boxSizing: "border-box",
      border: 0,
      borderRadius: theme.radius,
      outline: state.isFocusVisible ? `1px solid ${theme.focusColor}` : "none",
      outlineOffset: 1,
      cursor: state.isDisabled ? "not-allowed" : "pointer",
      opacity: state.isDisabled ? controlOpacity.disabled : 1,
      font: "inherit",
      lineHeight: 1.5,
      textAlign: "start",
      userSelect: "none",
      WebkitTapHighlightColor: "transparent",
      ...(disclosure.isExpanded
        ? state.isPressed ? theme.paints.palette.pressed : state.isHovered ? theme.paints.palette.hover : theme.paints.palette.rest
        : state.isPressed ? theme.paints.subtle.pressed : state.isHovered ? theme.paints.subtle.hover : { background: "transparent", color: "inherit" }),
      ...style
    })}
  >
    <span style={{ minWidth: 0 }}>{children}</span>
    <span
      aria-hidden="true"
      style={{
        ...motion,
        transitionProperty: "transform",
        width: "0.5em",
        height: "0.5em",
        marginInline: "0.25em",
        borderInlineEnd: "1px solid currentColor",
        borderBlockEnd: "1px solid currentColor",
        transform: disclosure.isExpanded ? "rotate(225deg)" : "rotate(45deg)"
      }}
    />
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
  const { motion } = useDisclosureTheme()
  const disclosure = useDisclosureState()
  const { appearance } = useResolvedAppearance()

  return <AriaDisclosurePanel
    {...properties}
    ref={ref}
    className={className}
    style={{
      ...motion,
      transitionProperty: "height, opacity",
      height: "var(--disclosure-panel-height)",
      overflow: "clip",
      opacity: disclosure.isExpanded ? 1 : 0,
      ...style
    }}
  >
    <div style={{ minHeight: 0, overflow: "hidden" }}>
      <div style={{ padding: resolveSpacing(padding, appearance) }}>{children}</div>
    </div>
  </AriaDisclosurePanel>
})

function useDisclosureState() {
  const state = useContext(DisclosureStateContext)
  if (state == null) throw new Error("Disclosure parts must be used inside Disclosure")
  return state
}

function useDisclosureTheme() {
  const context = useContext(DisclosureThemeContext)
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
