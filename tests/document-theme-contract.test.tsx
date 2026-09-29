import { cleanup, render } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"
import { DocumentTheme, UIProvider, usePreferences, type Theme } from "../source/main.js"

afterEach(function () {
  cleanup()
  document.head.querySelectorAll('meta[name="color-scheme" i]').forEach(meta => meta.remove())
})

function themed(theme: Theme) {
  return <UIProvider preferences={{ theme, animations: false }}><DocumentTheme /></UIProvider>
}

const declared = () => [...document.head.querySelectorAll<HTMLMetaElement>('meta[name="color-scheme" i]')].map(meta => meta.content)

it("declares the nearest Theme as the document's color scheme and follows its changes", function () {
  const rendered = render(themed("dark"))
  expect(declared()).toEqual(["dark"])
  rendered.rerender(themed("light"))
  expect(declared()).toEqual(["light"])
  rendered.unmount()
  expect(declared()).toEqual([])
})

it("writes into the declaration the document already has, and gives it back", function () {
  const meta = Object.assign(document.createElement("meta"), { name: "Color-Scheme", content: "light dark" })
  document.head.append(meta)
  const rendered = render(themed("dark"))
  expect(declared()).toEqual(["dark"])
  rendered.unmount()
  expect(declared()).toEqual(["light dark"])
})

it("changes the page to a new Theme in one step, and lets it ease again once painted", async function () {
  const marked = () => document.documentElement.hasAttribute("data-phreshos-theme-change")
  const rendered = render(themed("light"))
  expect(marked()).toBe(false)
  rendered.rerender(themed("dark"))
  expect(marked()).toBe(true)
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  expect(marked()).toBe(false)
})

it("renders nothing in place", function () {
  const { container } = render(themed("dark"))
  expect(container.innerHTML).toBe("")
})

/** A stand-in for the browser's View Transitions: it runs the update when told to. */
function viewTransitions() {
  const updates: (() => void)[] = []
  const start = vi.fn((update: () => void) => { updates.push(update); return { finished: new Promise(() => undefined) } })
  Object.assign(document, { startViewTransition: start })
  return { start, run: () => updates.splice(0).forEach(update => update()), restore: () => { delete (document as { startViewTransition?: unknown }).startViewTransition } }
}

function ShownTheme() {
  return <span data-testid="shown">{usePreferences().theme}</span>
}

it("crosses the page it owns to a new Theme with the page's own view transition", function () {
  const transitions = viewTransitions()
  const page = (theme: Theme, animations = true) => <UIProvider preferences={{ theme, animations }}><DocumentTheme /><ShownTheme /></UIProvider>
  const rendered = render(page("light"))
  rendered.rerender(page("dark"))
  expect(transitions.start).toHaveBeenCalledTimes(1)
  // The page still looks as it did until the transition has taken it.
  expect(rendered.getByTestId("shown").textContent).toBe("light")
  transitions.run()
  expect(rendered.getByTestId("shown").textContent).toBe("dark")
  // Without animations, the new Theme is simply shown.
  rendered.rerender(page("light", false))
  expect(transitions.start).toHaveBeenCalledTimes(1)
  expect(rendered.getByTestId("shown").textContent).toBe("light")
  transitions.restore()
})

it("shows a new Theme at once where it does not own the page", function () {
  const transitions = viewTransitions()
  const part = (theme: Theme) => <UIProvider preferences={{ theme, animations: true }}><ShownTheme /></UIProvider>
  const rendered = render(part("light"))
  rendered.rerender(part("dark"))
  expect(transitions.start).not.toHaveBeenCalled()
  expect(rendered.getByTestId("shown").textContent).toBe("dark")
  transitions.restore()
})
