import type { Color as AriaColor } from "react-aria-components"

/**
 * How React UI exchanges a color value: a hex string, with an alpha pair only
 * when the color is translucent. React Aria's Color objects stay internal.
 */
export function colorValue(color: AriaColor): string {
  return color.getChannelValue("alpha") < 1 ? color.toString("hexa") : color.toString("hex")
}
