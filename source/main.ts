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
export { Surface, type SurfaceProps } from "./surface.js"
export { Button, type ButtonProps } from "./button.js"
export type { LayoutAlignment, LayoutGap, LayoutJustification } from "./layout.js"
export { resolveRadius, type Radius, type RadiusProps } from "./radius.js"
export { resolveSpacing, type Spacing } from "./spacing.js"
export { useColor, type ColorLevel, type ColorScale } from "./color.js"
export { useScale, type NumericScale, type ScaleLevel } from "./scale.js"
