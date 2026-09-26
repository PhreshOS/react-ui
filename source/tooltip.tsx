import { forwardRef } from "react"
import type { ComponentProps, CSSProperties, ReactNode } from "react"
import { Tooltip as AriaTooltip, TooltipTrigger as AriaTooltipTrigger } from "react-aria-components"
import type {
  TooltipProps as AriaTooltipProps,
  TooltipTriggerComponentProps as AriaTooltipTriggerProps
} from "react-aria-components"
import { Button, type ButtonProps } from "./button.js"
import { controlFontSizes } from "./control/control.js"
import { ariaOpenState, type AriaOverlayInternals, type OverlayRootProps } from "./control/open-state.js"
import { resolveDirection, useDirection, type Direction } from "./foundation/direction.js"
import MotionStyle, { overlayMotionClass, overlayTransition } from "./foundation/motion-style.js"
import { resolveDirectionalPlacement } from "./foundation/overlay-placement.js"
import { scale } from "./foundation/scale.js"
import { useVisual } from "./foundation/visual.js"
import { floatingShadow } from "./surface/shadow-options.js"
import { Surface, type SurfaceOwnProps } from "./surface/surface.js"

export type TooltipRootProps = OverlayRootProps & Readonly<Pick<AriaTooltipTriggerProps, "delay" | "closeDelay" | "trigger">> & Readonly<{
  /** Whether the Tooltip is prevented from opening. */
  disabled?: boolean
  /** Whether pressing the trigger closes the Tooltip. Defaults to `true`. */
  closeOnPress?: boolean
}>

export function TooltipRoot({ children, delay, closeDelay, trigger, disabled, closeOnPress, ...state }: TooltipRootProps) {
  return <AriaTooltipTrigger
    {...ariaOpenState(state)}
    delay={delay}
    closeDelay={closeDelay}
    trigger={trigger}
    isDisabled={disabled}
    shouldCloseOnPress={closeOnPress}
  >{children}</AriaTooltipTrigger>
}

export type TooltipTriggerProps = ButtonProps

export const TooltipTrigger = forwardRef<HTMLButtonElement, TooltipTriggerProps>(function TooltipTrigger(properties, ref) {
  return <Button {...properties} ref={ref} />
})

/** The floating Surface of a Tooltip: its placement, its own Surface, and element attributes. */
export interface TooltipContentProps extends
  Omit<AriaTooltipProps, AriaOverlayInternals | "children" | "className" | "color" | "style" | "dir">,
  SurfaceOwnProps {
  readonly children?: ReactNode
  readonly className?: string
  readonly dir?: Direction
  readonly style?: CSSProperties
}

export const TooltipContent = forwardRef<HTMLDivElement, TooltipContentProps>(function TooltipContent({
  children,
  className,
  color,
  material,
  radius,
  shadow,
  style,
  offset,
  placement = "top",
  dir,
  ...attributes
}, ref) {
  const visual = useVisual()
  const inset = scale(visual.spacing, "small")
  const transition = overlayTransition(visual)
  const direction = resolveDirection(dir, useDirection())

  return <><MotionStyle /><AriaTooltip
    {...attributes}
    ref={ref}
    dir={direction}
    offset={offset ?? inset}
    placement={resolveDirectionalPlacement(placement, direction)}
    className={overlayMotionClass}
    style={transition}
  >
    <Surface
      dir={direction}
      className={className}
      color={color ?? "foreground"}
      material={material}
      radius={radius}
      shadow={shadow ?? floatingShadow(visual.shadow)}
      style={{
        boxSizing: "border-box",
        maxWidth: "28em",
        paddingBlock: inset,
        paddingInline: inset * 1.5,
        outline: "none",
        fontSize: controlFontSizes.small,
        lineHeight: 1.4,
        ...style
      }}
    >{children}</Surface>
  </AriaTooltip></>
})

/** A description shown from the focus and hover state of its trigger. */
export const Tooltip = Object.assign(TooltipRoot, {
  Trigger: TooltipTrigger,
  Content: TooltipContent
})

export type TooltipProps = ComponentProps<typeof TooltipRoot>
