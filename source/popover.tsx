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
  HeadingProps as AriaHeadingProps,
  PopoverProps as AriaPopoverProps
} from "react-aria-components"
import { Button, type ButtonProps } from "./button.js"
import { controlFontSizes, controlFontWeight } from "./control/control.js"
import { ariaOpenState, type AriaOverlayInternals, type OverlayRootProps } from "./control/open-state.js"
import { resolveDirection, useDirection, type Direction } from "./foundation/direction.js"
import MotionStyle, { overlayMotionClass, overlayTransition } from "./foundation/motion-style.js"
import { resolveDirectionalPlacement } from "./foundation/overlay-placement.js"
import { scale } from "./foundation/scale.js"
import { useVisual } from "./foundation/visual.js"
import { floatingShadow } from "./surface/shadow-options.js"
import { Surface, type SurfaceOwnProps } from "./surface/surface.js"

export type PopoverRootProps = OverlayRootProps

export function PopoverRoot({ children, ...state }: PopoverRootProps) {
  return <AriaDialogTrigger {...ariaOpenState(state)}>{children}</AriaDialogTrigger>
}

export type PopoverTriggerProps = ButtonProps

export const PopoverTrigger = forwardRef<HTMLButtonElement, PopoverTriggerProps>(function PopoverTrigger(properties, ref) {
  return <Button {...properties} ref={ref} />
})

/**
 * The floating Surface of an overlay. Its open state belongs to the family
 * root, so this part takes placement, its own Surface, and ordinary element
 * attributes.
 */
export interface PopoverContentProps extends
  Omit<AriaPopoverProps, AriaOverlayInternals | "children" | "className" | "color" | "style" | "dir">,
  SurfaceOwnProps {
  readonly children?: ReactNode
  readonly className?: string
  readonly dir?: Direction
  /** DOM container that owns the positioned overlay's coordinate space. */
  readonly portalContainer?: Element
  readonly style?: CSSProperties
}

// A context menu must not trap the page like a modal overlay; that choice
// belongs to ContextMenu and is not part of the public content contract.
type PositionedContentProps = PopoverContentProps & Readonly<{ nonModal?: boolean }>

const PositionedContent = forwardRef<HTMLElement, PositionedContentProps>(function PositionedContent({
  children,
  className,
  color,
  material,
  radius,
  shadow,
  style,
  offset,
  placement = "bottom",
  nonModal,
  dir,
  portalContainer,
  ...attributes
}, ref) {
  const visual = useVisual()
  const inset = scale(visual.spacing, "small")
  const transition = overlayTransition(visual)
  const direction = resolveDirection(dir, useDirection())

  return <><MotionStyle /><AriaPopover
    {...attributes}
    isNonModal={nonModal}
    ref={ref}
    dir={direction}
    offset={offset ?? inset}
    placement={resolveDirectionalPlacement(placement, direction)}
    UNSTABLE_portalContainer={portalContainer}
    className={overlayMotionClass}
    style={transition}
  >
    <Surface
      dir={direction}
      className={className}
      color={color}
      material={material}
      shadow={shadow ?? floatingShadow(visual.shadow)}
      radius={radius}
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

export const PopoverContent = forwardRef<HTMLElement, PopoverContentProps>(function PopoverContent(properties, ref) {
  return <PositionedContent {...properties} ref={ref} />
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

/** Positioned content that holds a Menu; it keeps the Appearance radius like every shell. */
export const MenuContent = PositionedContent

/** An anchored non-modal overlay with explicit trigger, surface, and dialog roles. */
export const Popover = Object.assign(PopoverRoot, {
  Trigger: PopoverTrigger,
  Content: PopoverContent,
  Dialog: PopoverDialog,
  Title: PopoverTitle,
  Close: PopoverClose
})

export type PopoverProps = ComponentProps<typeof PopoverRoot>
