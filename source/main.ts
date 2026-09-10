/**
 * Public entry point for the React UI library.
 *
 * Components enter this surface only after their implementation-independent
 * behavior contract has been established by the package's tests.
 */
export {
  AppearanceProvider,
  useAppearance,
  useResolveTheme,
  useTheme,
  type AppearanceProviderProps
} from "./appearance-provider.js"
export { Flex, type FlexProps } from "./flex.js"
export { Grid, type GridProps } from "./grid.js"
export { Material, type MaterialProps } from "./material.js"
export { Surface, type SurfaceElement, type SurfaceOptions, type SurfaceOverrides, type SurfaceProps } from "./surface.js"
export { Panel, type PanelProps } from "./panel.js"
export { Button, type ButtonColor, type ButtonProps } from "./button.js"
export { Input, type InputProps } from "./input.js"
export { Textarea, type TextareaProps } from "./textarea.js"
export { Checkbox, type CheckboxProps } from "./checkbox.js"
export { Radio, RadioGroup, type RadioProps, type RadioGroupProps } from "./radio.js"
export { Switch, type SwitchProps } from "./switch.js"
export { Select, type SelectProps, type SelectOption } from "./select.js"
export { Slider, type SliderProps } from "./slider.js"
export type { ControlColor } from "./control.js"
export type { LayoutAlignment, LayoutGap, LayoutJustification } from "./layout.js"
export { resolveRadius, type Radius, type RadiusProps } from "./radius.js"
export { resolveSpacing, type Spacing } from "./spacing.js"
export { useColor, type ColorLevel, type ColorScale } from "./color.js"
export { useScale, type NumericScale, type ScaleLevel } from "./scale.js"
