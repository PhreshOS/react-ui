import { act, cleanup, render, screen } from "@testing-library/react"
import { renderToString } from "react-dom/server"
import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { Loading, UIProvider, defaultAppearance, timing, useRequirement } from "../source/main.js"

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

function Need({ ready, detail }: Readonly<{ ready: boolean, detail?: unknown }>) {
  useRequirement(ready, detail)
  return null
}

function view(node: React.ReactNode) {
  return <UIProvider appearance={defaultAppearance}>{node}</UIProvider>
}

function held() {
  return document.querySelector("[data-readiness]")?.hasAttribute("inert")
}

it("shows the message of the first waiting requirement under a Spinner", function () {
  const { rerender } = render(view(<Loading>
    <Need ready detail="Connecting…" />
    <Need ready={false} detail="Loading wallpaper…" />
    <button>Start</button>
  </Loading>))

  expect(screen.getByRole("status").textContent).toBe("Loading wallpaper…")
  expect(held()).toBe(true)

  rerender(view(<Loading>
    <Need ready={false} detail="Connecting…" />
    <Need ready={false} detail="Loading wallpaper…" />
    <button>Start</button>
  </Loading>))
  expect(screen.getByRole("status").textContent).toBe("Connecting…")
})

it("waits for requirements without a string message without showing them", function () {
  render(view(<Loading><Need ready={false} /><Need ready={false} detail={{ step: 1 }} /></Loading>))

  expect(screen.getByRole("status").textContent).toBe("")
  expect(held()).toBe(true)
})

it("lists every step with its own progress", function () {
  render(view(<Loading steps>
    <Need ready detail="Connecting" />
    <Need ready={false} detail="Loading programs" />
    <Need ready={false} />
  </Loading>))

  const items = screen.getAllByRole("listitem")
  expect(items.map(item => [item.textContent, item.dataset.ready])).toEqual([
    ["Connecting", "true"],
    ["Loading programs", "false"]
  ])
})

it("fades out when ready, keeping its last message, then leaves the tree", function () {
  const { rerender } = render(view(<Loading><Need ready={false} detail="Connecting…" /></Loading>))

  rerender(view(<Loading><Need ready detail="Connecting…" /></Loading>))
  const status = document.querySelector<HTMLElement>("[role=status]")
  expect(held()).toBe(false)
  expect(status?.style.opacity).toBe("0")
  expect(status?.textContent).toBe("Connecting…")

  act(() => vi.advanceTimersByTime(timing("change").duration))
  expect(document.querySelector("[role=status]")).toBeNull()
})

it("shows again at once when a requirement stops being ready", function () {
  const { rerender } = render(view(<Loading><Need ready detail="Connected" /></Loading>))
  act(() => vi.advanceTimersByTime(timing("change").duration))
  expect(document.querySelector("[role=status]")).toBeNull()

  rerender(view(<Loading><Need ready={false} detail="Reconnecting…" /></Loading>))
  const status = document.querySelector<HTMLElement>("[role=status]")
  expect(status?.style.opacity).toBe("1")
  expect(status?.textContent).toBe("Reconnecting…")
})

it("passes its delay to the boundary", function () {
  const { rerender } = render(view(<Loading delay={80}><Need ready={false} detail="Loading" /></Loading>))
  rerender(view(<Loading delay={80}><Need ready detail="Loading" /></Loading>))
  expect(held()).toBe(true)
  expect(document.querySelector<HTMLElement>("[role=status]")?.style.opacity).toBe("1")

  act(() => vi.advanceTimersByTime(80))
  expect(held()).toBe(false)
})

it("hides the waiting interface, keeping its layout, and shows it whole once ready", function () {
  const { rerender } = render(view(<Loading><Need ready={false} /><p>Desktop</p></Loading>))
  const content = document.querySelector<HTMLElement>("[data-loading-content]")

  expect(content?.style.visibility).toBe("hidden")
  expect(content?.style.display).toBe("contents")

  rerender(view(<Loading><Need ready /><p>Desktop</p></Loading>))
  expect(content?.style.visibility).toBe("")
})

it("paints nothing behind the Spinner, so the Surface beneath shows through", function () {
  render(view(<Loading><Need ready={false} /></Loading>))
  const status = document.querySelector<HTMLElement>("[role=status]")

  expect(status?.classList.contains("phreshos-surface")).toBe(false)
  expect(status?.style.background).toBe("")
  expect(status?.style.pointerEvents).toBe("")
})

it("takes a class and a style for the layer that shows the loading", function () {
  render(view(<Loading className="opening" style={{ inset: 8 }}><Need ready={false} /></Loading>))
  const status = document.querySelector<HTMLElement>("[role=status]")

  expect(status?.classList.contains("opening")).toBe(true)
  expect(status?.style.inset).toBe("8px")
})

it("is hidden and held in server HTML", function () {
  const html = renderToString(view(<Loading><p>Desktop</p></Loading>))
  expect(html).toContain("inert")
  expect(html).toContain("visibility:hidden")
  expect(html).toContain('role="status"')
})
