import { forwardRef, useContext, useEffect } from "react"
import type { ComponentProps, CSSProperties, ReactNode } from "react"
import {
  Dialog as AriaDialog,
  DialogTrigger as AriaDialogTrigger,
  Heading as AriaHeading,
  OverlayTriggerStateContext,
  Popover as AriaPopover
} from "react-aria-components"
import type {
  DialogProps as AriaDialogProps,
  HeadingProps as AriaHeadingProps,
  PopoverProps as AriaPopoverProps
} from "react-aria-components"
import { Button, type ButtonActionProps } from "./button.js"
import { controlFontSizes, controlFontWeight, controlLineHeight } from "./control/control.js"
import { ariaOpenState, type AriaOverlayInternals, type OverlayRootProps } from "./control/open-state.js"
import { resolveDirection, useDirection, type Direction } from "./foundation/direction.js"
import MotionStyle, { overlayMotionClass, overlayTransition } from "./foundation/motion-style.js"
import { resolveDirectionalPlacement } from "./foundation/overlay-placement.js"
import { scale } from "./foundation/scale.js"
import { useVisual } from "./foundation/visual.js"
import { floatingMaterial } from "./surface/material-options.js"
import { floatingShadow } from "./surface/shadow-options.js"
import { FloatingLayer, Surface, type SurfaceOwnProps } from "./surface/surface.js"
import { containerZoom } from "./foundation/container-zoom.js"

export type PopoverRootProps = OverlayRootProps

export function PopoverRoot({ children, ...state }: PopoverRootProps) {
  return <AriaDialogTrigger {...ariaOpenState(state)}>{children}</AriaDialogTrigger>
}

export type PopoverTriggerProps = ButtonActionProps

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
  const zoom = containerZoom(portalContainer)
  const state = useContext(OverlayTriggerStateContext)

  // An open list or menu belongs to its window while that window has focus: when the person goes to
  // another window, it closes, as a native one does. In a frame this matters twice, since the frame's
  // focus would otherwise be pulled back into the list, away from the window the person went to.
  useEffect(() => {
    if (!state?.isOpen) return
    const close = () => state.close()
    window.addEventListener("blur", close)
    return () => window.removeEventListener("blur", close)
  }, [state])

  return <><MotionStyle /><AriaPopover
    {...attributes}
    isNonModal={nonModal}
    ref={ref}
    dir={direction}
    offset={offset ?? inset}
    placement={resolveDirectionalPlacement(placement, direction)}
    UNSTABLE_portalContainer={portalContainer}
    className={overlayMotionClass}
    style={zoom === 1 ? transition : { ...transition, zoom: 1 / zoom }}
  >
    <FloatingLayer><Surface
      dir={direction}
      className={className}
      color={color}
      material={material ?? floatingMaterial}
      shadow={shadow ?? floatingShadow}
      radius={radius}
      style={{
        boxSizing: "border-box",
        maxWidth: `calc((100vw - ${inset * 2}px) / ${zoom})`,
        maxHeight: `calc((100vh - ${inset * 2}px) / ${zoom})`,
        outline: "none",
        ...(zoom === 1 ? {} : { zoom }),
        ...style
      }}
    >{children}</Surface></FloatingLayer>
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
      lineHeight: controlLineHeight,
      ...style
    }}
  />
})

export type PopoverCloseProps = ButtonActionProps

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
