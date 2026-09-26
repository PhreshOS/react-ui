/**
 * Every distinct Surface paint becomes one shared class. Surfaces repeat the
 * same few paints across a whole interface, so changing Theme or hovering a
 * control swaps one class name instead of rewriting a dozen inline properties
 * on every element, which dominated the cost of large Theme changes.
 *
 * Rules use zero specificity, so any consumer class or inline style still wins.
 */
const classes = new Map<string, string>()
const pending: string[] = []
let sheet: CSSStyleSheet | null = null

/** Returns the class for one declaration block, registering it on first use. */
export function paintClass(declarations: string): string {
  const cached = classes.get(declarations)
  if (cached !== undefined) return cached
  const name = `phreshos-paint-${classes.size.toString(36)}`
  classes.set(declarations, name)
  pending.push(`:where(.${name}) { ${declarations} }`)
  return name
}

/** Inserts every registered rule not yet in the document. Runs before layout effects. */
export function flushPaintRules(): void {
  if (pending.length === 0 || typeof document === "undefined") return
  if (sheet === null) {
    const element = document.createElement("style")
    element.setAttribute("data-phreshos-paint", "")
    document.head.append(element)
    sheet = element.sheet
  }
  for (const rule of pending.splice(0)) sheet?.insertRule(rule, sheet.cssRules.length)
}

/** Whether generated rules can reach a document in this environment. */
export const paintClassesAvailable = typeof document !== "undefined"
