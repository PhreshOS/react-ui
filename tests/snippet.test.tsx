import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"
import { Snippet, UIProvider, defaultAppearance } from "../source/main.js"

afterEach(() => { cleanup(); vi.useRealTimers() })

it("shows that it copied for a moment, then is the copy button again", async function () {
  vi.useFakeTimers()
  const writeText = vi.fn(async () => undefined)
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true })
  render(<UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations: false }}>
    <Snippet copyLabel="Copy the command">phresh skill</Snippet>
  </UIProvider>)

  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Copy the command" })) })
  expect(writeText).toHaveBeenCalledWith("phresh skill")
  expect(screen.getByRole("button", { name: "Copied" })).toBeDefined()

  await act(async () => { vi.advanceTimersByTime(2000) })
  expect(screen.getByRole("button", { name: "Copy the command" })).toBeDefined()
})
