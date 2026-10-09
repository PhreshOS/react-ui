import { forwardRef } from "react"
import type { ComponentProps, CSSProperties, ReactNode } from "react"
import { Tooltip as AriaTooltip, TooltipTrigger as AriaTooltipTrigger } from "react-aria-components"
import type {
  TooltipProps as AriaTooltipProps,
  TooltipTriggerComponentProps as AriaTooltipTriggerProps
} from "react-aria-components"
import { Button, type ButtonActionProps } from "./button.js"
import { controlFontSizes, controlLineHeight } from "./control/control.js"
import { ariaOpenState, type AriaOverlayInternals, type OverlayRootProps } from "./control/open-state.js"
import { resolveDirection, useDirection, type Direction } from "./foundation/direction.js"
import MotionStyle, { overlayMotionClass, overlayTransition } from "./foundation/motion-style.js"
import { resolveDirectionalPlacement } from "./foundation/overlay-placement.js"
import { scale } from "./foundation/scale.js"
import { useVisual } from "./foundation/visual.js"
import { timing } from "./foundation/timing.js"
import { floatingShadow } from "./surface/shadow-options.js"
import { FloatingLayer, Surface, type SurfaceOwnProps } from "./surface/surface.js"

export type TooltipRootProps = OverlayRootProps & Readonly<Pick<AriaTooltipTriggerProps, "closeDelay" | "trigger">> & Readonly<{
  /** Milliseconds the pointer rests on the trigger before the Tooltip opens: four changes in place by default. */
  delay?: number
  /** Whether the Tooltip is prevented from opening. */
  disabled?: boolean
  /** Whether pressing the trigger closes the Tooltip. Defaults to `true`. */
  closeOnPress?: boolean
}>

export function TooltipRoot({ children, delay, closeDelay, trigger, disabled, closeOnPress, ...state }: TooltipRootProps) {
  // A pointer resting on a trigger for four changes in place is asking what it is.
  const rest = timing("change", { tempo: useVisual().appearance.tempo }).duration * 4
  return <AriaTooltipTrigger
    {...ariaOpenState(state)}
    delay={delay ?? rest}
    closeDelay={closeDelay}
    trigger={trigger}
    isDisabled={disabled}
    shouldCloseOnPress={closeOnPress}
  >{children}</AriaTooltipTrigger>
}

export type TooltipTriggerProps = ButtonActionProps

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
  /** DOM container that owns the positioned overlay's coordinate space. */
  readonly portalContainer?: Element
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
  portalContainer,
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
    UNSTABLE_portalContainer={portalContainer}
    className={overlayMotionClass}
    style={transition}
  >
    <FloatingLayer><Surface
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
        lineHeight: controlLineHeight,
        ...style
      }}
    >{children}</Surface></FloatingLayer>
  </AriaTooltip></>
})

/** A description shown from the focus and hover state of its trigger. */
export const Tooltip = Object.assign(TooltipRoot, {
  Trigger: TooltipTrigger,
  Content: TooltipContent
})

export type TooltipProps = ComponentProps<typeof TooltipRoot>
