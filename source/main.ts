/**
 * Public entry point for the React UI library.
 *
 * Components enter this surface only after their implementation-independent
 * behavior contract has been established by the package's tests.
 */
export { defaultAppearance } from "@phreshos/core"
export {
  AppearanceProvider,
  useAppearance,
  useBrowserPreferences,
  useDirection,
  useDocumentDirection,
  usePreferences,
  useThemedValue,
  type AppearanceProviderProps
} from "./appearance-provider.js"
export type { DesktopPreferences as Preferences } from "@phreshos/core"
export type { Direction } from "./direction.js"
export { Flex, type FlexProps } from "./flex.js"
export { Grid, type GridProps } from "./grid.js"
export {
  Surface,
  type MaterialOptions,
  type ShadowOptions,
  type SurfaceComponent,
  type SurfaceHost,
  type SurfaceHostProps,
  type SurfaceOwnProps,
  type SurfaceProps
} from "./surface.js"
export { defaultColor, type Color, type ColorLevel, type ColorScale } from "./color.js"
export {
  Panel,
  PanelRoot,
  PanelHeader,
  PanelContent,
  type PanelProps,
  type PanelRootProps,
  type PanelHeaderProps,
  type PanelContentProps
} from "./panel.js"
export { Button, type ButtonColor, type ButtonProps } from "./button.js"
export { Input, type InputProps } from "./input.js"
export { Textarea, type TextareaProps } from "./textarea.js"
export { Checkbox, type CheckboxProps } from "./checkbox.js"
export { Radio, RadioGroup, type RadioProps, type RadioGroupProps } from "./radio.js"
export { Switch, type SwitchProps } from "./switch.js"
export { Select, type SelectProps, type SelectOption } from "./select.js"
export { Slider, type SliderProps } from "./slider.js"
export { ScrollArea, type ScrollAreaAxis, type ScrollAreaProps } from "./scroll-area.js"
export {
  Popover,
  PopoverRoot,
  PopoverTrigger,
  PopoverContent,
  PopoverDialog,
  PopoverTitle,
  PopoverClose,
  type PopoverProps,
  type PopoverRootProps,
  type PopoverTriggerProps,
  type PopoverContentProps,
  type PopoverDialogProps,
  type PopoverTitleProps,
  type PopoverCloseProps
} from "./popover.js"
export {
  Menu,
  MenuRoot,
  MenuItem,
  MenuSection,
  MenuHeader,
  MenuSeparator,
  type MenuProps,
  type MenuRootProps,
  type MenuItemProps,
  type MenuSectionProps,
  type MenuHeaderProps,
  type MenuSeparatorProps
} from "./menu.js"
export {
  DropdownMenu,
  DropdownMenuRoot,
  DropdownMenuTrigger,
  type DropdownMenuProps,
  type DropdownMenuRootProps,
  type DropdownMenuTriggerProps
} from "./dropdown-menu.js"
export {
  ContextMenu,
  ContextMenuRoot,
  ContextMenuTrigger,
  type ContextMenuProps,
  type ContextMenuRootProps,
  type ContextMenuTriggerProps
} from "./context-menu.js"
export {
  Dialog,
  DialogRoot,
  DialogTrigger,
  DialogBackdrop,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  DialogClose,
  type DialogProps,
  type DialogRootProps,
  type DialogTriggerProps,
  type DialogBackdropProps,
  type DialogContentProps,
  type DialogHeaderProps,
  type DialogTitleProps,
  type DialogDescriptionProps,
  type DialogBodyProps,
  type DialogFooterProps,
  type DialogCloseProps
} from "./dialog.js"
export {
  AlertDialog,
  AlertDialogRoot,
  AlertDialogBackdrop,
  AlertDialogContent,
  type AlertDialogProps,
  type AlertDialogRootProps,
  type AlertDialogBackdropProps,
  type AlertDialogContentProps
} from "./alert-dialog.js"
export {
  Tooltip,
  TooltipRoot,
  TooltipTrigger,
  TooltipContent,
  type TooltipProps,
  type TooltipRootProps,
  type TooltipTriggerProps,
  type TooltipContentProps
} from "./tooltip.js"
export type { ControlColor } from "./control.js"
export type { LayoutAlignment, LayoutGap, LayoutJustification } from "./layout.js"
export { resolveRadius, type Radius, type RadiusProps } from "./radius.js"
export { resolveSpacing, type Spacing } from "./spacing.js"
export { useColor } from "./color.js"
export { useScale, type NumericScale, type ScaleLevel } from "./scale.js"
