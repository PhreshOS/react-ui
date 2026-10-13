import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { afterEach, expect, it, vi } from "vitest"
import { DocumentTabs, UIProvider, defaultAppearance } from "../source/main.js"

afterEach(cleanup)

type Open = Readonly<{ id: string, title: string }>

const opened: readonly Open[] = [{ id: "a", title: "Alpha" }, { id: "b", title: "Beta" }, { id: "c", title: "Gamma" }]

/** Tabs whose caller applies every close and move at once, as the Tabs ask. */
function Opened({ onAdd, onClose }: Readonly<{ onAdd?: () => void, onClose?: (id: string) => void }>) {
  const [tabs, setTabs] = useState(opened)
  const [value, setValue] = useState("a")
  return <UIProvider appearance={defaultAppearance}>
    <DocumentTabs aria-label="Pages" value={value} onChange={setValue} onAdd={onAdd} addLabel="New page"
      onClose={id => { onClose?.(id); setTabs(current => current.filter(tab => tab.id !== id)) }}
      onMove={(id, index) => setTabs(current => {
        const moving = current.find(tab => tab.id === id)!
        const rest = current.filter(tab => tab.id !== id)
        return [...rest.slice(0, index), moving, ...rest.slice(index)]
      })}>
      {tabs.map(tab => <DocumentTabs.Tab key={tab.id} id={tab.id} title={tab.title} />)}
    </DocumentTabs>
  </UIProvider>
}

const titles = () => screen.queryAllByRole("tab").map(tab => tab.textContent)

it("chooses one open thing, and opens a new one from its button", async () => {
  const add = vi.fn()
  render(<Opened onAdd={add} />)

  await userEvent.click(screen.getByRole("tab", { name: "Beta" }))
  expect(screen.getByRole("tab", { name: "Beta" }).getAttribute("aria-selected")).toBe("true")

  await userEvent.click(screen.getByRole("button", { name: "New page" }))
  expect(add).toHaveBeenCalledOnce()
})

it("closes one from its close button, a middle click, or Delete, without choosing it", async () => {
  const close = vi.fn()
  render(<Opened onClose={close} />)

  // The close button belongs to its Tab: assistive technology hears only the Tab.
  // It shows on the chosen Tab and the one under the pointer.
  const beta = screen.getByRole("tab", { name: "Beta" })
  await userEvent.hover(beta)
  await userEvent.click(beta.querySelector("[aria-hidden=true]")!)
  expect(close).toHaveBeenLastCalledWith("b")
  expect(titles()).toEqual(["Alpha", "Gamma"])
  expect(screen.getByRole("tab", { name: "Alpha" }).getAttribute("aria-selected")).toBe("true")

  fireEvent(screen.getByRole("tab", { name: "Gamma" }), new MouseEvent("auxclick", { bubbles: true, button: 1 }))
  expect(titles()).toEqual(["Alpha"])

  screen.getByRole("tab", { name: "Alpha" }).focus()
  await userEvent.keyboard("{Delete}")
  expect(titles()).toEqual([])
})

it("moves the focused one a place with Ctrl+Shift and an arrow, keeping it focused", async () => {
  render(<Opened />)

  screen.getByRole("tab", { name: "Alpha" }).focus()
  await userEvent.keyboard("{Control>}{Shift>}{ArrowRight}{/Shift}{/Control}")
  expect(titles()).toEqual(["Beta", "Alpha", "Gamma"])
  expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Alpha" }))

  await userEvent.keyboard("{Control>}{Shift>}{ArrowRight}{ArrowRight}{/Shift}{/Control}")
  expect(titles()).toEqual(["Beta", "Gamma", "Alpha"])

  // An arrow alone still only moves the focus.
  await userEvent.keyboard("{ArrowLeft}")
  expect(titles()).toEqual(["Beta", "Gamma", "Alpha"])
  expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Gamma" }))
})

it("leaves Tabs fixed and open when the caller neither moves nor closes them", async () => {
  render(<UIProvider appearance={defaultAppearance}>
    <DocumentTabs aria-label="Pages" defaultValue="a">
      {opened.map(tab => <DocumentTabs.Tab key={tab.id} id={tab.id} title={tab.title} />)}
    </DocumentTabs>
  </UIProvider>)

  expect(screen.getByRole("tab", { name: "Alpha" }).querySelector("[aria-hidden=true]")).toBeNull()
  expect(screen.queryByRole("button")).toBeNull()
  screen.getByRole("tab", { name: "Alpha" }).focus()
  await userEvent.keyboard("{Control>}{Shift>}{ArrowRight}{/Shift}{/Control}{Delete}")
  expect(titles()).toEqual(["Alpha", "Beta", "Gamma"])
})

it("holds no choice while nothing is open, and takes the first one that opens without changing hands", () => {
  const warned = vi.spyOn(console, "error").mockImplementation(() => undefined)
  const strip = (tabs: readonly Open[], value: string | null) => <UIProvider appearance={defaultAppearance}>
    <DocumentTabs aria-label="Pages" value={value} onChange={() => undefined}>
      {tabs.map(tab => <DocumentTabs.Tab key={tab.id} id={tab.id} title={tab.title} />)}
    </DocumentTabs>
  </UIProvider>
  const rendered = render(strip([], null))

  rendered.rerender(strip(opened, "b"))

  expect(screen.getByRole("tab", { name: "Beta" }).getAttribute("aria-selected")).toBe("true")
  expect(warned.mock.calls.flat().join(" ")).not.toMatch(/uncontrolled|controlled/)
  warned.mockRestore()
})
