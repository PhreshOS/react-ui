import { Calendar as CalendarIcon } from "lucide-react"
import type { ControlMetrics } from "./control/control.js"
import { FieldButton } from "./control/field-button.js"
import { iconProps } from "./control/icon.js"

/** The calendar button at the end of a date picker well. */
export function CalendarTrigger({ metrics }: Readonly<{ metrics: ControlMetrics }>) {
  return <FieldButton data-date-control-end="" metrics={metrics} style={{ marginInlineEnd: -Math.max(4, metrics.inset - 4) }}>
    <CalendarIcon {...iconProps(16)} />
  </FieldButton>
}
