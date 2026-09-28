import { forwardRef, useState } from "react"
import type { CSSProperties } from "react"
import { Check, Copy } from "lucide-react"
import { controlFontSizes, useControlMetrics } from "./control/control.js"
import { iconProps } from "./control/icon.js"
import { resolveRadius } from "./foundation/radius.js"
import { Button } from "./button.js"
import { Surface } from "./surface/surface.js"
import { scale } from "./foundation/scale.js"

export interface SnippetProps {
  /** The text to show and copy. */
  readonly children: string
  /** Sets the text in the monospace font, for commands and code. */
  readonly code?: boolean
  /** Names the copy button for assistive technology; "Copy" by default. */
  readonly copyLabel?: string
  readonly className?: string
  readonly style?: CSSProperties
}

/**
 * A block of text meant to be copied whole, such as a command or a message to
 * hand on. It sits in a recess, can be selected at once, and copies itself
 * from the button in its corner.
 */
export const Snippet = forwardRef<HTMLDivElement, SnippetProps>(function Snippet({ children, code = false, copyLabel = "Copy", className, style }, ref) {
  const metrics = useControlMetrics("small")
  const { spacing, radius } = metrics.visual
  const [copied, setCopied] = useState(false)
  // A recess holding one value, like a field: it pads as a control does, not as a container.
  const padding = scale(spacing, "medium")

  return <Surface ref={ref} className={className} color="background" depth="recessed" radius={resolveRadius("medium", radius)} style={{
    position: "relative",
    display: "block",
    // Room at the end for the copy button, so text never runs under it.
    padding,
    paddingInlineEnd: padding + metrics.height + metrics.gap,
    // Its text reads at the size of a field's value, whatever surrounds it.
    fontSize: controlFontSizes.medium,
    ...style
  }}>
    <div style={{
      whiteSpace: "pre-wrap",
      overflowWrap: "anywhere",
      userSelect: "all",
      lineHeight: 1.6,
      fontFamily: code ? "ui-monospace, SFMono-Regular, Menlo, monospace" : "inherit",
      fontSize: code ? "0.9em" : undefined
    }}>{children}</div>
    <Button size="small" shadow={false} aria-label={copied ? "Copied" : copyLabel}
      iconOnly style={{ position: "absolute", insetBlockStart: padding / 2, insetInlineEnd: padding / 2 }}
      onPress={() => void copyText(children).then(setCopied)}>
      {copied ? <Check {...iconProps(14)} /> : <Copy {...iconProps(14)} />}
    </Button>
  </Surface>
})

/**
 * Writes text to the clipboard and reports whether it could. A Program's frame
 * may refuse the Clipboard API, so the older copy command is tried after it.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const field = document.createElement("textarea")
    field.value = text
    field.setAttribute("readonly", "")
    field.style.position = "fixed"
    field.style.opacity = "0"
    document.body.append(field)
    field.select()
    const copied = document.execCommand("copy")
    field.remove()
    return copied
  }
}
