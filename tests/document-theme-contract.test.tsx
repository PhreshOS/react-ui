import { cleanup, render } from "@testing-library/react"
import { afterEach, expect, it } from "vitest"
import { DocumentTheme, UIProvider, type Theme } from "../source/main.js"

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
