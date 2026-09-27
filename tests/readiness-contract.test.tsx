import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { StrictMode, useState } from "react"
import { renderToString } from "react-dom/server"
import { afterEach, expect, expectTypeOf, it, vi } from "vitest"
import {
  Readiness,
  useReadiness,
  useRequirement,
  type ReadinessState,
  type Requirement
} from "../source/main.js"

afterEach(cleanup)

function boundaries() {
  return [...document.querySelectorAll<HTMLElement>("[data-readiness]")]
}

function Need({ ready, detail }: Readonly<{ ready: boolean, detail?: string }>) {
  useRequirement(ready, detail)
  return null
}

function Report() {
  const { ready, requirements } = useReadiness<string | undefined>()
  return <output>{ready ? "ready" : requirements.filter(requirement => !requirement.ready).map(requirement => requirement.detail ?? "?").join(",")}</output>
}

it("holds its children until every requirement is ready, drawing nothing itself", function () {
  const view = render(<Readiness><Need ready={false} /><button>Save</button></Readiness>)
  const [boundary] = boundaries()

  expect(boundary?.hasAttribute("inert")).toBe(true)
  expect(boundary?.style.display).toBe("contents")
  expect(boundary?.childNodes.length).toBe(1)

  view.rerender(<Readiness><Need ready /><button>Save</button></Readiness>)
  expect(boundary?.hasAttribute("inert")).toBe(false)
})

it("is ready after the first commit when nothing is required", function () {
  render(<Readiness><button>Save</button></Readiness>)
  expect(boundaries()[0]?.hasAttribute("inert")).toBe(false)
})

it("is held in server HTML, before any requirement can register", function () {
  const html = renderToString(<Readiness><button>Save</button></Readiness>)
  expect(html).toContain("inert")
})

it("follows each requirement both ways and forgets it on unmount", function () {
  function View({ connected, loading }: Readonly<{ connected: boolean, loading: boolean }>) {
    return <Readiness status={<Report />}>
      <Need ready={connected} detail="Connecting" />
      {loading && <Need ready={false} detail="Loading" />}
    </Readiness>
  }

  const view = render(<View connected={false} loading />)
  expect(screen.getByRole("status").textContent).toBe("Connecting,Loading")

  view.rerender(<View connected loading />)
  expect(screen.getByRole("status").textContent).toBe("Loading")

  view.rerender(<View connected loading={false} />)
  expect(screen.getByRole("status").textContent).toBe("ready")

  view.rerender(<View connected={false} loading={false} />)
  expect(screen.getByRole("status").textContent).toBe("Connecting")
  expect(boundaries()[0]?.hasAttribute("inert")).toBe(true)
})

it("lists every requirement in declaration order with its detail as given", function () {
  let seen: ReadinessState<string> | undefined
  function Capture() {
    seen = useReadiness<string>()
    return null
  }

  render(<Readiness status={<Capture />}>
    <Need ready detail="Session" />
    <Need ready={false} detail="Wallpaper" />
  </Readiness>)

  expect(seen?.ready).toBe(false)
  expect(seen?.requirements).toEqual([
    { ready: true, detail: "Session" },
    { ready: false, detail: "Wallpaper" }
  ])
})

it("keeps status interactive while the children are held", function () {
  function View() {
    const [loaded, setLoaded] = useState(false)
    return <Readiness status={({ ready }) => ready ? null : <button onClick={() => setLoaded(true)}>Skip</button>}>
      <Need ready={loaded} />
      <button>Save</button>
    </Readiness>
  }

  render(<View />)
  const skip = screen.getByRole("button", { name: "Skip" })
  expect(skip.closest("[inert]")).toBeNull()
  expect(screen.getByRole("button", { name: "Save" }).closest("[inert]")).toBeTruthy()

  fireEvent.click(skip)
  expect(screen.queryByRole("button", { name: "Skip" })).toBeNull()
  expect(boundaries()[0]?.hasAttribute("inert")).toBe(false)
})

it("gives a status function the same state useReadiness returns", function () {
  let fromHook: ReadinessState | undefined
  let fromFunction: ReadinessState | undefined
  function Capture() {
    fromHook = useReadiness()
    return null
  }

  render(<Readiness status={state => { fromFunction = state; return <Capture /> }}>
    <Need ready={false} detail="Loading" />
  </Readiness>)

  expect(fromFunction).toBe(fromHook)
})

it("keeps each requirement in its nearest boundary only", function () {
  function View({ page }: Readonly<{ page: boolean }>) {
    return <Readiness status={<Report />}>
      <Need ready detail="Sidebar" />
      <Readiness><Need ready={page} detail="Page" /></Readiness>
    </Readiness>
  }

  const view = render(<View page />)
  expect(screen.getByRole("status").textContent).toBe("ready")

  // A part that starts waiting while running holds only itself.
  view.rerender(<View page={false} />)
  const [outer, inner] = boundaries()
  expect(screen.getByRole("status").textContent).toBe("ready")
  expect(outer?.hasAttribute("inert")).toBe(false)
  expect(inner?.hasAttribute("inert")).toBe(true)
})

it("stays held for its delay after the requirements are ready", function () {
  vi.useFakeTimers()
  try {
    const view = render(<Readiness delay={80} status={<Report />}><Need ready={false} detail="Loading" /></Readiness>)
    view.rerender(<Readiness delay={80} status={<Report />}><Need ready detail="Loading" /></Readiness>)
    expect(boundaries()[0]?.hasAttribute("inert")).toBe(true)
    expect(screen.getByRole("status").textContent).toBe("")

    act(() => vi.advanceTimersByTime(80))
    expect(boundaries()[0]?.hasAttribute("inert")).toBe(false)
  } finally {
    vi.useRealTimers()
  }
})

it("starts the delay again when a requirement is lost during it", function () {
  vi.useFakeTimers()
  try {
    const view = render(<Readiness delay={80}><Need ready detail="Loading" /></Readiness>)
    act(() => vi.advanceTimersByTime(40))
    view.rerender(<Readiness delay={80}><Need ready={false} detail="Loading" /></Readiness>)
    view.rerender(<Readiness delay={80}><Need ready detail="Loading" /></Readiness>)
    act(() => vi.advanceTimersByTime(40))
    expect(boundaries()[0]?.hasAttribute("inert")).toBe(true)

    act(() => vi.advanceTimersByTime(40))
    expect(boundaries()[0]?.hasAttribute("inert")).toBe(false)
  } finally {
    vi.useRealTimers()
  }
})

it("gives requirements declared in status to the parent boundary", function () {
  render(<Readiness status={<Report />}>
    <Readiness status={<Need ready={false} detail="Cover" />}>
      <button>Save</button>
    </Readiness>
  </Readiness>)

  const [outer, inner] = boundaries()
  expect(inner?.hasAttribute("inert")).toBe(false)
  expect(outer?.hasAttribute("inert")).toBe(true)
  expect(screen.getByRole("status").textContent).toBe("Cover")
})

it("keeps the same result through Strict Mode effect restoration", function () {
  render(<StrictMode>
    <Readiness status={<Report />}>
      <Need ready={false} detail="Strict" />
    </Readiness>
  </StrictMode>)

  expect(boundaries()[0]?.hasAttribute("inert")).toBe(true)
  expect(screen.getByRole("status").textContent).toBe("Strict")
})

it("updates in the same act as the component whose condition changed", function () {
  let finish: () => void = () => undefined
  function Loader() {
    const [done, setDone] = useState(false)
    finish = () => setDone(true)
    useRequirement(done)
    return null
  }

  render(<Readiness><Loader /></Readiness>)
  act(() => finish())
  expect(boundaries()[0]?.hasAttribute("inert")).toBe(false)
})

it("requires a boundary around its hooks", function () {
  function Outside() {
    useRequirement(true)
    return null
  }
  function Reader() {
    useReadiness()
    return null
  }

  expect(() => render(<Outside />)).toThrow(/inside a Readiness boundary/)
  expect(() => render(<Reader />)).toThrow(/inside a Readiness boundary/)
})

it("types detail exactly as the reader states it", function () {
  expectTypeOf(useReadiness<string>).returns.toEqualTypeOf<ReadinessState<string>>()
  expectTypeOf<Requirement<string>["detail"]>().toEqualTypeOf<string>()
  expectTypeOf<Requirement["detail"]>().toEqualTypeOf<unknown>()
})
