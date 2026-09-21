import { forwardRef } from "react"
import type { ComponentProps, CSSProperties, ReactNode } from "react"
import { Tooltip as AriaTooltip, TooltipTrigger as AriaTooltipTrigger } from "react-aria-components"
import type {
  TooltipProps as AriaTooltipProps,
  TooltipTriggerComponentProps as AriaTooltipTriggerProps
} from "react-aria-components"
import { useResolvedAppearance } from "./appearance-context.js"
import { Button, type ButtonProps } from "./button.js"
import { controlFontSizes } from "./control.js"
import MotionStyle, { overlayMotionClass, overlayTransition } from "./motion-style.js"
import { scale } from "./scale.js"
import { Surface, type SurfaceOwnProps } from "./surface.js"
import { resolveDirection, useDirection } from "./direction.js"
import { resolveDirectionalPlacement } from "./overlay-placement.js"

export type TooltipRootProps = AriaTooltipTriggerProps

export function TooltipRoot(properties: TooltipRootProps) {
  return <AriaTooltipTrigger {...properties} />
}

export type TooltipTriggerProps = ButtonProps

export const TooltipTrigger = forwardRef<HTMLButtonElement, TooltipTriggerProps>(function TooltipTrigger(properties, ref) {
  return <Button {...properties} ref={ref} />
})

export interface TooltipContentProps extends
  Omit<AriaTooltipProps, "children" | "className" | "color" | "style">,
  SurfaceOwnProps {
  readonly children?: ReactNode
  readonly className?: string
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
  ...properties
}, ref) {
  const resolved = useResolvedAppearance()
  const inset = scale(resolved.appearance.spacing, "small")
  const transition = overlayTransition(resolved.transaction, resolved.preferences.animations)
  const direction = resolveDirection(properties.dir, useDirection())

  return <><MotionStyle /><AriaTooltip
    {...properties}
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
      color={color}
      material={material}
      radius={radius}
      shadow={shadow}
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
