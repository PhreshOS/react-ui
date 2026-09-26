/**
 * The treatment of every icon React UI draws inside its own components: a
 * constant 1.5px stroke at any size, hidden from assistive technology because
 * the control that holds it carries the name.
 */
export function iconProps(size: number) {
  return { size, strokeWidth: 1.5, nonScalingStroke: true, "aria-hidden": true } as const
}
