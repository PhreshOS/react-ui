import { forwardRef } from "react"
import type { CSSProperties, ReactNode } from "react"
import {
  Button as AriaButton,
  Link as AriaLink,
  type ButtonProps as AriaButtonProps,
  type ButtonRenderProps,
  type LinkProps as AriaLinkProps,
  type LinkRenderProps
} from "react-aria-components"
import { controlOpacity, transition, useControlMetrics, type ControlProps } from "./control/control.js"
import { surfaceRender } from "./control/surface-render.js"
import type { Color } from "./foundation/color.js"
import type { RadiusProps } from "./foundation/radius.js"
import type { MaterialOverrides } from "./surface/material-options.js"
import type { ShadowOverrides } from "./surface/shadow-options.js"

type NativeButtonProps = Omit<AriaButtonProps, "children" | "className" | "color" | "isDisabled" | "isPending" | "onClick" | "onPress" | "render" | "style">
type NativeLinkProps = Omit<AriaLinkProps, "children" | "className" | "color" | "href" | "isDisabled" | "onClick" | "onPress" | "render" | "style">

/** A color from Appearance or CSS; omission keeps the Button neutral. */
export type ButtonColor = Color

interface ButtonOwnProps extends ControlProps, RadiusProps, MaterialOverrides, ShadowOverrides {
  readonly children?: ReactNode
  /** Runs once for a normalized pointer, Enter, or Space activation. */
  readonly onPress?: () => void
}

/** A Button that acts: a native `<button>`. */
export interface ButtonActionProps extends NativeButtonProps, ButtonOwnProps {
  readonly href?: undefined
  /** Prevents activation while keeping the Button focusable. */
  readonly pending?: boolean
}

/**
 * A Button that goes somewhere: a native `<a>` that looks and behaves like
 * every other Button. Links inside the app use the `navigate` given to
 * UIProvider; any other link is followed by the browser.
 */
export interface ButtonLinkProps extends NativeLinkProps, ButtonOwnProps {
  readonly href: string
  readonly pending?: never
  readonly type?: never
}

export type ButtonProps = ButtonActionProps | ButtonLinkProps

/** A raised Surface you act on, or follow when it has an `href`. */
export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(function Button(properties, ref) {
  const { children, color = "default", disabled, radius, size, style, className, material, shadow, ...rest } = properties
  const metrics = useControlMetrics(size, radius)
  const surface = (state: Readonly<{ isHovered: boolean, isPressed: boolean, isFocusVisible: boolean, isDisabled: boolean }>, pending: boolean) => ({
    color,
    material,
    shadow,
    radius: metrics.radius,
    interaction: {
      hovered: !state.isDisabled && !pending && state.isHovered,
      pressed: !state.isDisabled && !pending && state.isPressed,
      focusVisible: state.isFocusVisible,
      disabled: state.isDisabled
    }
  })

  if (rest.href !== undefined) {
    const { pending: _pending, type: _type, ...link } = rest as ButtonLinkProps
    return <AriaLink
      {...link}
      ref={ref as React.Ref<HTMLAnchorElement>}
      className={className}
      isDisabled={disabled}
      render={(native, state) => {
        // A disabled link has no destination: React Aria expects a span without an href.
        const { href: _href, ...inert } = native as { href?: string }
        return state.isDisabled
          ? surfaceRender<LinkRenderProps>("span", state => surface(state, false))(inert, state)
          : surfaceRender<LinkRenderProps>("a", state => surface(state, false))(native, state)
      }}
      style={state => buttonStyle(metrics, !state.isDisabled && state.isPressed, state.isDisabled, false, style)}
    >{children}</AriaLink>
  }

  const { pending = false, type = "button", ...action } = rest as ButtonActionProps
  // Disabled state is read from React Aria, so a Button placed in a slot, such
  // as a calendar's month buttons, follows the owner that disables it.
  return <AriaButton
    {...action}
    ref={ref as React.Ref<HTMLButtonElement>}
    type={type}
    className={className}
    isDisabled={disabled}
    isPending={pending}
    render={surfaceRender<ButtonRenderProps>("button", state => surface(state, pending))}
    style={state => buttonStyle(metrics, !state.isDisabled && !pending && state.isPressed, state.isDisabled, pending, style)}
  >{children}</AriaButton>
})

function buttonStyle(metrics: ReturnType<typeof useControlMetrics>, pressed: boolean, disabled: boolean, pending: boolean, style: CSSProperties | undefined): CSSProperties {
  return {
    ...transition(metrics.visual, "box-shadow, color, outline-color, opacity, scale"),
    appearance: "none",
    boxSizing: "border-box",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: metrics.gap,
    flexShrink: 0,
    minWidth: 0,
    height: metrics.height,
    paddingBlock: 0,
    paddingInline: metrics.inset,
    border: 0,
    background: "none",
    font: "inherit",
    fontSize: metrics.fontSize,
    fontWeight: 500,
    lineHeight: 1,
    whiteSpace: "nowrap",
    textDecoration: "none",
    userSelect: "none",
    WebkitTapHighlightColor: "transparent",
    cursor: disabled ? "not-allowed" : pending ? "progress" : "pointer",
    scale: pressed ? "0.97" : "1",
    ...(pending ? { opacity: controlOpacity.pending } : {}),
    ...style
  }
}
