import { forwardRef } from "react"
import type { ComponentProps, CSSProperties, ReactNode } from "react"
import {
  Dialog as AriaDialog,
  DialogTrigger as AriaDialogTrigger,
  Heading as AriaHeading,
  Popover as AriaPopover
} from "react-aria-components"
import type {
  DialogProps as AriaDialogProps,
  DialogTriggerProps as AriaDialogTriggerProps,
  HeadingProps as AriaHeadingProps,
  PopoverProps as AriaPopoverProps
} from "react-aria-components"
import { useResolvedAppearance } from "./appearance-context.js"
import { Button, type ButtonProps } from "./button.js"
import { controlFontSizes, controlFontWeight } from "./control.js"
import MotionStyle, { overlayMotionClass, overlayTransition } from "./motion-style.js"
import { scale } from "./scale.js"
import { Surface, type SurfaceOwnProps } from "./surface.js"
import { resolveDirection, useDirection } from "./direction.js"
import { resolveDirectionalPlacement } from "./overlay-placement.js"

export type PopoverRootProps = AriaDialogTriggerProps

export function PopoverRoot(properties: PopoverRootProps) {
  return <AriaDialogTrigger {...properties} />
}

export type PopoverTriggerProps = ButtonProps

export const PopoverTrigger = forwardRef<HTMLButtonElement, PopoverTriggerProps>(function PopoverTrigger(properties, ref) {
  return <Button {...properties} ref={ref} />
})

export interface PopoverContentProps extends
  Omit<AriaPopoverProps, "children" | "className" | "color" | "style">,
  SurfaceOwnProps {
  readonly children?: ReactNode
  readonly className?: string
  readonly style?: CSSProperties
}

export const PopoverContent = forwardRef<HTMLElement, PopoverContentProps>(function PopoverContent({
  children,
  className,
  color,
  material,
  radius,
  shadow,
  style,
  offset,
  placement = "bottom",
  ...properties
}, ref) {
  const resolved = useResolvedAppearance()
  const inset = scale(resolved.appearance.spacing, "small")
  const transition = overlayTransition(resolved.transaction, resolved.preferences.animations)
  const direction = resolveDirection(properties.dir, useDirection())

  return <><MotionStyle /><AriaPopover
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
        maxWidth: `calc(100vw - ${inset * 2}px)`,
        maxHeight: `calc(100vh - ${inset * 2}px)`,
        outline: "none",
        ...style
      }}
    >{children}</Surface>
  </AriaPopover></>
})

export type PopoverDialogProps = AriaDialogProps

export const PopoverDialog = forwardRef<HTMLElement, PopoverDialogProps>(function PopoverDialog({ style, ...properties }, ref) {
  return <AriaDialog {...properties} ref={ref} style={{ minWidth: 0, outline: "none", ...style }} />
})

export type PopoverTitleProps = AriaHeadingProps

export const PopoverTitle = forwardRef<HTMLHeadingElement, PopoverTitleProps>(function PopoverTitle({ style, ...properties }, ref) {
  return <AriaHeading
    {...properties}
    ref={ref}
    slot="title"
    // Portalled headings cannot rely on the trigger subtree to neutralize
    // browser heading defaults; this part owns its complete text treatment.
    style={{
      margin: 0,
      fontFamily: "inherit",
      fontSize: controlFontSizes.medium,
      fontWeight: controlFontWeight,
      lineHeight: 1.5,
      ...style
    }}
  />
})

export type PopoverCloseProps = ButtonProps

export const PopoverClose = forwardRef<HTMLButtonElement, PopoverCloseProps>(function PopoverClose(properties, ref) {
  return <Button {...properties} ref={ref} slot="close" />
})

/** An anchored non-modal overlay with explicit trigger, surface, and dialog roles. */
export const Popover = Object.assign(PopoverRoot, {
  Trigger: PopoverTrigger,
  Content: PopoverContent,
  Dialog: PopoverDialog,
  Title: PopoverTitle,
  Close: PopoverClose
})

export type PopoverProps = ComponentProps<typeof PopoverRoot>
