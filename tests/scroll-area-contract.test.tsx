import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { createRef } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { AppearanceProvider, ScrollArea } from "../source/main.js"

afterEach(cleanup)

describe("ScrollArea", function () {
  it("owns a native viewport and local vertical scrollbar by default", function () {
    const viewportRef = createRef<HTMLDivElement>()
    const rootRef = createRef<HTMLDivElement>()
    const onScroll = vi.fn()

    render(<ScrollArea data-testid="root" ref={rootRef} viewportRef={viewportRef} onScroll={onScroll} style={{ height: 120 }}>
      <p>Content</p>
    </ScrollArea>)

    const root = screen.getByTestId("root")
    const viewport = viewportRef.current!
    expect(rootRef.current).toBe(root)
    expect(viewport).not.toBe(root)
    expect(root.style.overflow).toBe("hidden")
    expect(viewport.style.overflowY).toBe("scroll")
    expect(viewport.style.overflowX).toBe("hidden")
    expect(root.querySelector('[data-phreshos-scroll-area-scrollbar][data-orientation="vertical"]')).not.toBeNull()
    expect(root.querySelector('[data-phreshos-scroll-area-scrollbar][data-orientation="horizontal"]')).toBeNull()

    fireEvent.scroll(viewport)
    expect(onScroll).toHaveBeenCalledOnce()
  })

  it("renders both overlay scrollbars only inside its own root", function () {
    render(<div data-testid="outside">
      <ScrollArea data-testid="area" axis="both"><div>Content</div></ScrollArea>
    </div>)

    const area = screen.getByTestId("area")
    const scrollbars = area.querySelectorAll("[data-phreshos-scroll-area-scrollbar]")
    expect(scrollbars).toHaveLength(2)
    expect([...scrollbars].every(scrollbar => (scrollbar as HTMLElement).style.position === "absolute")).toBe(true)
    expect(document.documentElement.getAttribute("style")).toBeNull()
  })

  it("resolves its colors from the nearest AppearanceProvider", function () {
    const view = render(<AppearanceProvider preferences={{ theme: "light", animations: true }}>
      <ScrollArea><div>Content</div></ScrollArea>
    </AppearanceProvider>)
    const thumb = view.container.querySelector<HTMLElement>("[data-phreshos-scroll-area-thumb]")!
    expect(thumb.style.backgroundColor).toContain("rgb(24, 52, 71)")

    view.rerender(<AppearanceProvider preferences={{ theme: "dark", animations: true }}>
      <ScrollArea><div>Content</div></ScrollArea>
    </AppearanceProvider>)
    expect(view.container.querySelector<HTMLElement>("[data-phreshos-scroll-area-thumb]")!.style.backgroundColor).toContain("rgb(237, 248, 252)")
  })
})
