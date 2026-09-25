import { act, cleanup, render, screen } from "@testing-library/react"
import { StrictMode } from "react"
import { afterEach, expect, it, vi } from "vitest"
import {
  Readiness,
  UIProvider,
  defaultAppearance,
  useReadiness,
  useRequirement,
  type ReadinessFallback,
  type ReadinessProps
} from "../source/main.js"

afterEach(cleanup)

it("keeps content mounted and inert until every registered requirement completes", function () {
  let complete: () => void = () => undefined

  function PreparedContent() {
    complete = useRequirement("Loading workspace")
    return <button>Prepared content</button>
  }

  renderReadiness(<Readiness fallback={requirements => (
    <p role="status">{requirements.at(-1)?.message}</p>
  )}><PreparedContent /></Readiness>)

  const boundary = document.querySelector<HTMLElement>("[data-readiness]")
  expect(boundary?.dataset.ready).toBe("false")
  expect(boundary?.hasAttribute("inert")).toBe(true)
  expect(screen.getByText("Prepared content")).toBeTruthy()
  expect(screen.getByRole("status").textContent).toBe("Loading workspace")

  act(() => complete())

  expect(boundary?.dataset.ready).toBe("true")
  expect(boundary?.hasAttribute("inert")).toBe(false)
  expect(screen.queryByRole("status")).toBeNull()
})

it("reveals after the first commit when no descendant registers work", function () {
  renderReadiness(<Readiness><p>Ready immediately</p></Readiness>)

  const boundary = document.querySelector<HTMLElement>("[data-readiness]")
  expect(boundary?.dataset.ready).toBe("true")
  expect(boundary?.hasAttribute("inert")).toBe(false)
})

it("ties a declarative Requirement to its mounted lifetime", function () {
  function Content({ pending }: Readonly<{ pending: boolean }>) {
    return <Readiness fallback={requirements => (
      <p role="status">{requirements.at(-1)?.message}</p>
    )}>
      {pending && <Readiness.Requirement message="Preparing session" />}
      <p>Session</p>
    </Readiness>
  }

  const view = renderReadiness(<Content pending />)
  expect(screen.getByRole("status").textContent).toBe("Preparing session")

  view.rerender(provider(<Content pending={false} />))

  expect(document.querySelector<HTMLElement>("[data-readiness]")?.dataset.ready).toBe("true")
  expect(screen.queryByRole("status")).toBeNull()
})

it("keeps mounted requirements pending through Strict Mode effect restoration", function () {
  renderReadiness(<StrictMode>
    <Readiness>
      <Readiness.Requirement message="Preparing strict tree" />
      <p>Strict content</p>
    </Readiness>
  </StrictMode>)

  const boundary = document.querySelector<HTMLElement>("[data-readiness]")
  expect(boundary?.dataset.ready).toBe("false")
  expect(boundary?.hasAttribute("inert")).toBe(true)
})

it("does not block an interface again after its first reveal", function () {
  function Content({ late }: Readonly<{ late: boolean }>) {
    return <Readiness>
      {late && <Readiness.Requirement message="Late update" />}
      <p>Stable interface</p>
    </Readiness>
  }

  const view = renderReadiness(<Content late={false} />)
  const boundary = document.querySelector<HTMLElement>("[data-readiness]")
  expect(boundary?.dataset.ready).toBe("true")

  view.rerender(provider(<Content late />))

  expect(boundary?.dataset.ready).toBe("true")
  expect(boundary?.hasAttribute("inert")).toBe(false)
})

it("represents a nested boundary as one parent requirement", function () {
  let complete: () => void = () => undefined
  let outerRequirements: readonly { message: string; readyAt: Date | null }[] = []

  function DeepContent() {
    complete = useRequirement("Loading project")
    return <p>Project</p>
  }

  renderReadiness(<Readiness message="Preparing workspace" fallback={requirements => {
    outerRequirements = requirements
    return null
  }}>
    <Readiness message="Opening project">
      <DeepContent />
    </Readiness>
  </Readiness>)

  expect(outerRequirements).toHaveLength(1)
  expect(outerRequirements[0]?.message).toBe("Loading project")

  act(() => complete())

  const boundaries = document.querySelectorAll<HTMLElement>("[data-readiness]")
  expect([...boundaries].every(boundary => boundary.dataset.ready === "true")).toBe(true)
})

it("passes the complete requirement history to a custom fallback", function () {
  let complete: () => void = () => undefined
  let latest: Parameters<ReadinessFallback>[0] = []
  const fallback = vi.fn<ReadinessFallback>(requirements => {
    latest = requirements
    return <strong>Custom: {requirements.at(-1)?.message}</strong>
  })

  function Content() {
    complete = useRequirement("Loading account")
    return null
  }

  renderReadiness(<Readiness fallback={fallback}><Content /></Readiness>)

  expect(screen.getByText("Custom: Loading account")).toBeTruthy()
  expect(latest).toHaveLength(1)
  expect(latest[0]).toMatchObject({ message: "Loading account", readyAt: null })
  expect(latest[0]?.createdAt).toBeInstanceOf(Date)

  act(() => complete())

  expect(latest[0]?.readyAt).toBeInstanceOf(Date)
})

it("leaves visual presentation entirely to the optional fallback", function () {
  renderReadiness(<Readiness>
    <Readiness.Requirement message="Preparing view" />
    <button>Visible but inactive</button>
  </Readiness>)

  const boundary = document.querySelector<HTMLElement>("[data-readiness]")
  expect(boundary?.style.display).toBe("contents")
  expect(boundary?.hasAttribute("inert")).toBe(true)
  expect(screen.getByText("Visible but inactive")).toBeTruthy()
  expect(screen.queryByRole("status")).toBeNull()
})

it("renders fallback output outside the inert content subtree", function () {
  renderReadiness(<Readiness fallback={() => <button>Fallback action</button>}>
    <Readiness.Requirement message="Preparing view" />
    <button>Application action</button>
  </Readiness>)

  expect(screen.getByText("Application action").closest("[inert]")).toBeTruthy()
  expect(screen.getByText("Fallback action").closest("[inert]")).toBeNull()
})

it("exposes the nearest boundary state through useReadiness", function () {
  function State() {
    const readiness = useReadiness()
    return <output data-ready={readiness.ready ? "true" : "false"}>
      {readiness.requirements.map(requirement => requirement.message).join(",")}
    </output>
  }

  renderReadiness(<Readiness>
    <Readiness.Requirement message="Preparing state" />
    <State />
  </Readiness>)

  const state = screen.getByText("Preparing state")
  expect(state.getAttribute("data-ready")).toBe("false")
})

it("keeps messages textual in the public contract", function () {
  const properties: ReadinessProps = {
    children: <span />,
    fallback: requirements => <span>{requirements[0]?.message}</span>,
    message: "Loading"
  }

  expect(properties.message).toBe("Loading")

  // @ts-expect-error Readiness messages are data consumed by the fallback, not presentation.
  const invalid: ReadinessProps = { children: null, message: <span /> }
  void invalid
})

function renderReadiness(component: React.ReactNode) {
  return render(provider(component))
}

function provider(component: React.ReactNode) {
  return <UIProvider appearance={defaultAppearance} preferences={{ theme: "light", animations: false }}>
    {component}
  </UIProvider>
}
