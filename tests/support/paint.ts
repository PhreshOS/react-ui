/** Reads the declarations of the generated paint class applied to one element. */
export function paintDeclarations(element: Element): Record<string, string> {
  const name = [...element.classList].find(value => value.startsWith("phreshos-paint-"))
  if (name === undefined) throw new Error("The element has no Surface paint")
  for (const sheet of document.styleSheets) {
    for (const rule of sheet.cssRules) {
      if (!rule.cssText.includes(`.${name})`)) continue
      const body = rule.cssText.slice(rule.cssText.indexOf("{") + 1, rule.cssText.lastIndexOf("}"))
      const result: Record<string, string> = {}
      for (const declaration of body.split(";")) {
        const separator = declaration.indexOf(":")
        if (separator < 0) continue
        result[declaration.slice(0, separator).trim()] = declaration.slice(separator + 1).trim()
      }
      return result
    }
  }
  throw new Error(`No rule exists for ${name}`)
}

/** The resolved fill of a Surface. */
export function surfaceFill(element: Element): string {
  return paintDeclarations(element)["--phreshos-surface-paint"]!
}

/** Normalizes a color the way the browser serializes standard properties. */
export function cssColor(value: string): string {
  const element = document.createElement("span")
  element.style.color = value
  return element.style.color
}

function shadowParts(value: string | undefined): string[] {
  return (value ?? "none").split(/,(?![^(]*\))/).map(part => part.trim()).filter(part => part !== "none")
}

/** Whether a Surface casts an outer shadow beyond its hairline. */
export function lifted(value: string | undefined): boolean {
  return shadowParts(value).some(part => !/^0(px)? 0(px)? 0(px)? /.test(part))
}

/** The color of a Surface's outer hairline. */
export function hairline(value: string | undefined): string {
  const part = shadowParts(value).find(entry => /^0(px)? 0(px)? 0(px)? /.test(entry)) ?? ""
  return part.replace(/^0(px)? 0(px)? 0(px)? [\d.]+px\s*/, "")
}
