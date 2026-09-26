import { cleanup, render } from "@testing-library/react"
import { afterEach, expect, it } from "vitest"
import { UIProvider } from "../source/main.js"
import { Settings } from "../source/icons/main.js"

afterEach(cleanup)

it("gives icons the text size and color with a constant stroke inside a UIProvider", function () {
  const view = render(<UIProvider><Settings data-testid="default" /><Settings data-testid="sized" size={20} /></UIProvider>)
  const icon = view.getByTestId("default")
  expect(icon.getAttribute("width")).toBe("1em")
  expect(icon.getAttribute("stroke")).toBe("currentColor")
  expect(icon.getAttribute("stroke-width")).toBe("1.5")
  expect(icon.getAttribute("aria-hidden")).toBe("true")
  // The icon's own props still win over the provider defaults.
  expect(view.getByTestId("sized").getAttribute("width")).toBe("20")
})
