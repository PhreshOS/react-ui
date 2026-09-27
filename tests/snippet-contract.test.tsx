import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactNode } from "react"
import { afterEach, expect, it, vi } from "vitest"
import { Snippet, UIProvider, defaultAppearance } from "../source/main.js"

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function renderSnippet(node: ReactNode) {
  return render(<UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations: false }}>{node}</UIProvider>)
}

it("shows its text whole and selectable, in the monospace font only for code", function () {
  renderSnippet(<><Snippet>Plain words</Snippet><Snippet code>phresh describe</Snippet></>)

  const plain = screen.getByText("Plain words")
  const code = screen.getByText("phresh describe")
  expect(plain.style.userSelect).toBe("all")
  expect(plain.style.fontFamily).toBe("inherit")
  expect(code.style.fontFamily).toMatch(/monospace/)
})

it("copies its text from its own button and says so", async function () {
  // userEvent installs its own clipboard, so this one goes in after it.
  const user = userEvent.setup()
  const writeText = vi.fn(async () => undefined)
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true })
  renderSnippet(<Snippet copyLabel="Copy the command">npm install</Snippet>)

  await user.click(screen.getByRole("button", { name: "Copy the command" }))
  expect(writeText).toHaveBeenCalledWith("npm install")
  expect(screen.getByRole("button", { name: "Copied" })).toBeTruthy()
})

it("falls back to the copy command where the Clipboard API is refused", async function () {
  const user = userEvent.setup()
  Object.defineProperty(navigator, "clipboard", { value: { writeText: async () => { throw new Error("blocked") } }, configurable: true })
  const execCommand = vi.fn(() => true)
  Object.defineProperty(document, "execCommand", { value: execCommand, configurable: true })
  renderSnippet(<Snippet>Hand this on</Snippet>)

  await user.click(screen.getByRole("button", { name: "Copy" }))
  expect(execCommand).toHaveBeenCalledWith("copy")
  expect(screen.getByRole("button", { name: "Copied" })).toBeTruthy()
})

it("reads at the size of a field's value, not the size of the page around it", function () {
  const { container } = renderSnippet(<Snippet>Hand this on</Snippet>)
  expect((container.querySelector(".phreshos-surface") as HTMLElement).style.fontSize).toBe("0.8125em")
})
