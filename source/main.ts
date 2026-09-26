/**
 * Public entry point for the React UI library.
 *
 * Components enter this surface only after their implementation-independent
 * behavior contract has been established by the package's tests.
 */
export {
  appearanceLimits,
  defaultAppearance,
  type Appearance,
  type AppearanceColor,
  type AppearanceColors,
  type AppearanceMaterial,
  type AppearanceRange,
  type AppearanceShadow,
  type AppearanceTransaction,
  type AppearanceUpdate,
  type Easing,
  type ThemedValue
} from "./foundation/appearance.js"
export { UIProvider, type UIProviderProps } from "./foundation/provider.js"
export {
  useAppearance,
  useBrowserPreferences,
  usePreferences,
  useThemedValue
} from "./foundation/visual.js"
export { useDirection, useDocumentDirection, type Direction } from "./foundation/direction.js"
export type { Preferences, PreferencesUpdate, Theme } from "./foundation/preferences.js"
export { Flex, type FlexProps } from "./flex.js"
export { Grid, type GridProps } from "./grid.js"
export {
  Surface,
  type MaterialMode,
  type MaterialOptions,
  type ShadowOptions,
  type SurfaceComponent,
  type SurfaceDepth,
  type SurfaceHost,
  type SurfaceHostProps,
  type SurfaceOwnProps,
  type SurfaceProps
} from "./surface/surface.js"
export { resolveColor, useColor, useContrastingColor, type Color, type ColorLevel, type ColorScale } from "./foundation/color.js"
// Context-dependent parts are public only through their owning component family.
export {
  Panel,
  type PanelProps,
  type PanelHeaderProps,
  type PanelContentProps
} from "./panel.js"
export {
  Window,
  type WindowProps,
  type WindowContentProps,
  type WindowHeaderProps,
  type WindowIdentityProps,
  type WindowCenterProps,
  type WindowActionsProps,
  type WindowActionProps,
  type WindowControlProps,
  type WindowMaximizeProps,
  type WindowCloseProps,
  type WindowMoveCaptureProps
} from "./window.js"
export { default as useWindowMoveHandle, type WindowMoveHandle } from "./use-window-move-handle.js"
export { Button, type ButtonColor, type ButtonProps } from "./button.js"
export { Input, type InputProps } from "./input.js"
export { Textarea, type TextareaProps } from "./textarea.js"
export { DateField, type DateFieldProps } from "./date-field.js"
export { TimeField, type TimeFieldProps } from "./time-field.js"
export { Calendar, type CalendarProps } from "./calendar.js"
export { RangeCalendar, type RangeCalendarProps } from "./range-calendar.js"
export { DatePicker, type DatePickerProps } from "./date-picker.js"
export { DateRangePicker, type DateRangePickerProps } from "./date-range-picker.js"
export type { DateRange } from "./date-range.js"
export { Checkbox, type CheckboxProps } from "./checkbox.js"
export { RadioGroup, type RadioGroupProps, type RadioGroupItemProps } from "./radio.js"
export { Switch, type SwitchProps } from "./switch.js"
export { Select, type SelectProps } from "./select.js"
export { ComboBox, type ComboBoxProps } from "./combo-box.js"
export {
  ListBox,
  type ListBoxProps,
  type ListBoxSingleSelectionProps,
  type ListBoxMultipleSelectionProps,
  type ListBoxMultipleValue,
  type ListBoxItemProps,
  type ListBoxSectionProps,
  type ListBoxHeaderProps
} from "./list-box.js"
export {
  Tabs,
  type TabsProps,
  type TabsListProps,
  type TabsTabProps,
  type TabsPanelsProps,
  type TabsPanelProps
} from "./tabs.js"
export {
  Table,
  type TableProps,
  type TableNoSelectionProps,
  type TableSingleSelectionProps,
  type TableMultipleSelectionProps,
  type TableMultipleValue,
  type TableSort,
  type TableSortDirection,
  type TableHeaderProps,
  type TableColumnProps,
  type TableBodyProps,
  type TableRowProps,
  type TableCellProps
} from "./table.js"
export {
  Tree,
  type TreeProps,
  type TreeNoSelectionProps,
  type TreeSingleSelectionProps,
  type TreeMultipleSelectionProps,
  type TreeMultipleValue,
  type TreeItemProps,
  type TreeContentProps,
  type TreeCollectionProps
} from "./tree.js"
export { Slider, type SliderProps } from "./slider.js"
export { ProgressBar, type ProgressBarProps } from "./progress-bar.js"
export { Spinner, type SpinnerProps } from "./spinner.js"
export { NumberField, type NumberFieldProps } from "./number-field.js"
export { SegmentedControl, type SegmentedControlProps, type SegmentedControlItemProps } from "./segmented-control.js"
export { Alert, type AlertProps } from "./alert.js"
export { FileTrigger, type FileTriggerProps } from "./file-trigger.js"
export { DropZone, type DropZoneProps } from "./drop-zone.js"
export { Fieldset, type FieldsetProps } from "./fieldset.js"
export { AppLayout, type AppLayoutProps, type AppLayoutRegionProps } from "./app-layout.js"
export { ColorSwatch, type ColorSwatchProps } from "./color-swatch.js"
export { ColorSwatchPicker, type ColorSwatchPickerProps, type ColorSwatchPickerItemProps } from "./color-swatch-picker.js"
export { ColorSlider, type ColorSliderProps } from "./color-slider.js"
export { ColorArea, type ColorAreaProps } from "./color-area.js"
export { ColorField, type ColorFieldProps } from "./color-field.js"
export { ColorPicker, type ColorPickerRootProps, type ColorPickerTriggerProps, type ColorPickerContentProps } from "./color-picker.js"
export { ScrollArea, type ScrollAreaAxis, type ScrollAreaProps } from "./scroll-area.js"
export {
  Toolbar,
  type ToolbarProps,
  type ToolbarGroupProps,
  type ToolbarSeparatorProps
} from "./toolbar.js"
export {
  Disclosure,
  type DisclosureProps,
  type DisclosureTriggerProps,
  type DisclosureContentProps
} from "./disclosure.js"
export {
  Accordion,
  type AccordionProps,
  type AccordionSingleExpansionProps,
  type AccordionMultipleExpansionProps,
  type AccordionItemProps
} from "./accordion.js"
export {
  Popover,
  type PopoverProps,
  type PopoverTriggerProps,
  type PopoverContentProps,
  type PopoverDialogProps,
  type PopoverTitleProps,
  type PopoverCloseProps
} from "./popover.js"
export {
  Menu,
  type MenuProps,
  type MenuNoSelectionProps,
  type MenuSingleSelectionProps,
  type MenuMultipleSelectionProps,
  type MenuMultipleValue,
  type MenuItemProps,
  type MenuSectionProps,
  type MenuHeaderProps,
  type MenuSeparatorProps
} from "./menu.js"
export {
  DropdownMenu,
  type DropdownMenuProps,
  type DropdownMenuTriggerProps
} from "./dropdown-menu.js"
export {
  ContextMenu,
  type ContextMenuProps,
  type ContextMenuTriggerProps,
  type ContextMenuContentProps
} from "./context-menu.js"
export {
  Dialog,
  type DialogProps,
  type DialogTriggerProps,
  type DialogBackdropProps,
  type DialogBackdropVariant,
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
  type AlertDialogProps,
  type AlertDialogBackdropProps,
  type AlertDialogContentProps
} from "./alert-dialog.js"
export {
  Tooltip,
  type TooltipProps,
  type TooltipTriggerProps,
  type TooltipContentProps
} from "./tooltip.js"
export type { LayoutAlignment, LayoutGap, LayoutJustification } from "./foundation/layout.js"
export { resolveRadius, type Radius, type RadiusProps } from "./foundation/radius.js"
export { resolveSpacing, type Spacing } from "./foundation/spacing.js"
export { useScale, type NumericScale, type ScaleLevel } from "./foundation/scale.js"
