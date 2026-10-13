import { createContext, forwardRef, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import type { CSSProperties, ReactNode, RefObject } from "react"
import { Tab as AriaTab, TabList as AriaTabList, Tabs as AriaTabs, TabListStateContext } from "react-aria-components"
import { Plus, X } from "lucide-react"
import { Button } from "./button.js"
import { useControlMetrics, transition, type ControlMetrics } from "./control/control.js"
import { SelectionItemLabel, selectionItemStyle, SelectionTrack, selectionTrackInset } from "./control/selection-track.js"
import { stringKey } from "./control/selection.js"
import { AriaDirectionBoundary } from "./foundation/aria-direction.js"
import { colorOpacity, type Color } from "./foundation/color.js"
import { resolveDirection, useDirection, type Direction } from "./foundation/direction.js"
import type { RadiusProps } from "./foundation/radius.js"
import type { ScaleLevel } from "./foundation/scale.js"
import type { MaterialOverrides } from "./surface/material-options.js"
import { dimmedClass } from "./surface/surface.js"

/** How far a press travels before it becomes a drag; until then it may still be a click. */
const dragThreshold = 4

/** The space between two Tabs. */
const tabGap = 2

/**
 * The Tabs' layer in the track: above the selection, which lies at 1 at rest and rises to 3 under a
 * dragged Tab, which itself rises to 4.
 */
const tabLayer = 2
const liftedLayer = 4

/** How wide a Tab is with room to spare, and how narrow it gets before the strip scrolls, in control heights. */
const widest = 6
const narrowest = 2.5

/** The choice of no Tab, while none is chosen; React Aria's Tabs always hold a choice. */
const noTab = "\u0000none"

/** How long a dropped Tab waits for its caller to apply the move before it goes back to its place. */
const moveWait = 1000

/** How near the strip's edge a dragged tab scrolls it, and how far each frame. */
const edge = 24
const edgeStep = 8

type DocumentTabsContext = Readonly<{
  color: Color
  metrics: ControlMetrics
  direction: Direction
  closes: boolean
  onClose?: (id: string) => void
  onMove?: (id: string, index: number) => void
  beginDrag: (id: string, event: PointerEvent) => void
}>

const DocumentTabsStyleContext = createContext<DocumentTabsContext | null>(null)

export interface DocumentTabsProps extends RadiusProps, MaterialOverrides {
  readonly "aria-label"?: string
  readonly "aria-labelledby"?: string
  readonly children?: ReactNode
  readonly className?: string
  /** Paint of the raised selection. */
  readonly color?: Color
  readonly defaultValue?: string
  readonly dir?: Direction
  /** The open thing chosen, by its Tab's identity; null while none is, such as before any is open. */
  readonly value?: string | null
  readonly onChange?: (value: string) => void
  /**
   * Closes one: from its close button, a middle click, or Delete on it. Without it, Tabs do not close.
   * Which one is chosen next is the caller's.
   */
  readonly onClose?: (id: string) => void
  /**
   * Moves one to a new place among the others, dragged there or moved with Ctrl+Shift and the arrows.
   * The order is the caller's: apply it at once, or the Tab returns to where it was.
   */
  readonly onMove?: (id: string, index: number) => void
  /** Opens a new one; without it, no button opens one. */
  readonly onAdd?: () => void
  /** Name of the button that opens a new one; "New tab" unless given. */
  readonly addLabel?: string
  readonly size?: ScaleLevel
  readonly style?: CSSProperties
}

type Drag = {
  readonly id: string
  readonly pointer: number
  /** Where the press began, in the viewport. */
  readonly startX: number
  /** The list's scale on screen, so moves in the viewport become moves in its own pixels. */
  scale: number
  started: boolean
  origin: number
  target: number
  /** Every Tab where it stood when the drag began, in the list's own pixels, in their order. */
  tabs: readonly Readonly<{ id: string, element: HTMLElement, left: number, width: number }>[]
  /** The space between two Tabs. */
  gap: number
  /** Where the press began, in the list's own pixels. */
  startLeft: number
  /** Where the pointer is, in the viewport. */
  clientX: number
  /** Where the dragged Tab is drawn, in the list's own pixels. */
  left: number
}

/**
 * The things open in one place, such as a browser's pages or a terminal's sessions: one is chosen,
 * and people open, close, and reorder them. What each shows is the caller's; there are no Panels.
 */
const DocumentTabsRoot = forwardRef<HTMLDivElement, DocumentTabsProps>(function DocumentTabs({
  addLabel = "New tab", children, className, color = "default", defaultValue, dir, material, onAdd, onChange,
  onClose, onMove, radius, size, style, value, ...labels
}, ref) {
  const metrics = useControlMetrics(size, radius)
  const direction = resolveDirection(dir, useDirection())
  const scroller = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const drag = useRef<Drag | null>(null)
  const settle = useRef<{
    readonly id: string
    /** Where it was let go, in the list's own pixels. */
    readonly left: number
    /** Where it was moved to, or null when it stayed where it was. */
    readonly target: number | null
    /** Whether its move has waited long enough: the Tab then settles wherever it is drawn. */
    expired: boolean
    readonly stop: () => void
  } | null>(null)
  const [following, setFollowing] = useState(false)
  const [dropped, setDropped] = useState(0)
  const moved = useRef(onMove)
  moved.current = onMove
  const easing = transition(metrics.visual, "translate")
  const sliding = `${easing.transitionProperty} ${easing.transitionDuration} ${easing.transitionTimingFunction}`

  /**
   * A dropped Tab settles from where it was let go into its place, once its new place is drawn: the
   * caller applies the move, and the list draws it a moment later. Until then the Tabs stay as they
   * were dropped, so nothing jumps back and forth.
   */
  function settleIfDrawn() {
    const dropping = settle.current
    const strip = list.current
    if (dropping === null || strip === null) return
    const tabs = [...strip.querySelectorAll<HTMLElement>("[data-document-tab]")]
    const index = tabs.findIndex(tab => tab.dataset.documentTab === dropping.id)
    if (dropping.target !== null && index !== dropping.target && index >= 0 && !dropping.expired) return
    settle.current = null
    dropping.stop()
    for (const tab of tabs) {
      tab.style.transition = "none"
      tab.style.translate = ""
    }
    const tab = tabs[index]
    if (tab === undefined) return setFollowing(false)
    const { scale, left } = placeIn(strip, tab)
    const offset = dropping.left - left
    const done = () => {
      tab.style.transition = ""
      tab.style.translate = ""
      tab.style.zIndex = String(tabLayer)
      setFollowing(false)
    }
    if (Math.abs(offset) < 0.5 || scale === 0) return done()
    tab.style.translate = `${offset}px 0`
    tab.getBoundingClientRect()
    tab.style.transition = sliding
    tab.style.translate = "0px 0"
    const timer = setTimeout(done, metrics.visual.duration + 50)
    tab.addEventListener("transitionend", () => { clearTimeout(timer); done() }, { once: true })
  }

  const settled = useRef(settleIfDrawn)
  settled.current = settleIfDrawn

  // Each drawing may be the one that shows the new order.
  useLayoutEffect(() => settled.current(), [dropped])

  const context = useMemo<DocumentTabsContext>(() => ({
    color,
    metrics,
    direction,
    closes: onClose !== undefined,
    onClose,
    onMove,
    beginDrag(id, event) {
      const strip = list.current
      if (strip === null || drag.current !== null || moved.current === undefined) return
      drag.current = {
        id, pointer: event.pointerId, startX: event.clientX, scale: 1, started: false, origin: 0, target: 0,
        tabs: [], gap: 0, startLeft: 0, clientX: event.clientX, left: 0
      }
      let frame = 0

      const place = () => {
        const current = drag.current
        if (current === null || !current.started) return
        const box = strip.getBoundingClientRect()
        const dragged = current.tabs[current.origin]!
        const pointer = (current.clientX - box.left) / current.scale
        const left = Math.max(0, Math.min(strip.offsetWidth - dragged.width, dragged.left + pointer - current.startLeft))
        current.left = left
        dragged.element.style.translate = `${left - dragged.left}px 0`
        // It passes a neighbor once its leading edge crosses the neighbor's middle.
        const right = left + dragged.width
        const target = current.tabs.filter((tab, index) => {
          if (tab === dragged) return false
          const middle = tab.left + tab.width / 2
          const following = direction === "rtl" ? index < current.origin : index > current.origin
          const passed = following ? right > middle : left < middle
          // Those before it stay before unless passed; those after come before once passed.
          return index < current.origin ? !passed : passed
        }).length
        current.target = target
        // Those between where it was and where it goes step aside, into the place it left.
        current.tabs.forEach((tab, index) => {
          if (tab === dragged) return
          const between = current.origin < target ? index > current.origin && index <= target : index >= target && index < current.origin
          const toward = tab.left > dragged.left ? -1 : 1
          tab.element.style.translate = between ? `${toward * (dragged.width + current.gap)}px 0` : "0px 0"
        })
      }

      // Near an edge of a strip that scrolls, it scrolls on toward the dragged Tab.
      const scroll = () => {
        const current = drag.current
        const view = scroller.current
        if (current === null) return
        if (current.started && view !== null) {
          const box = view.getBoundingClientRect()
          const step = current.clientX < box.left + edge ? -edgeStep : current.clientX > box.right - edge ? edgeStep : 0
          if (step !== 0 && view.scrollWidth > view.clientWidth) {
            view.scrollLeft += step
            place()
          }
        }
        frame = requestAnimationFrame(scroll)
      }

      const moving = (event: PointerEvent) => {
        const current = drag.current
        if (current === null || event.pointerId !== current.pointer) return
        current.clientX = event.clientX
        if (!current.started) {
          if (Math.abs(event.clientX - current.startX) < dragThreshold) return
          const box = strip.getBoundingClientRect()
          const scale = strip.offsetWidth > 0 ? box.width / strip.offsetWidth : 1
          const tabs = [...strip.querySelectorAll<HTMLElement>("[data-document-tab]")].map(element => ({
            id: element.dataset.documentTab!,
            element,
            ...placeIn(strip, element, box, scale)
          }))
          const origin = tabs.findIndex(tab => tab.id === current.id)
          if (origin < 0 || scale === 0) return finish()
          const gap = tabGap
          Object.assign(current, { started: true, scale, tabs, gap, origin, target: origin, startLeft: (current.startX - box.left) / scale })
          for (const tab of tabs) tab.element.style.transition = tab.id === current.id ? "none" : sliding
          // Lifted above the others and above the selection that is its body.
          tabs[origin]!.element.style.zIndex = String(liftedLayer)
          setFollowing(true)
        }
        place()
      }

      const finish = () => {
        cancelAnimationFrame(frame)
        globalThis.removeEventListener("pointermove", moving, true)
        globalThis.removeEventListener("pointerup", finish, true)
        globalThis.removeEventListener("pointercancel", cancel, true)
        const current = drag.current
        drag.current = null
        if (current === null || !current.started) return
        const target = current.target !== current.origin ? current.target : null
        // The list is redrawn in the new order a moment after the caller applies it.
        const drawn = new MutationObserver(() => settled.current())
        drawn.observe(strip, { childList: true })
        const waited = setTimeout(() => {
          if (settle.current === null) return
          settle.current.expired = true
          settled.current()
        }, moveWait)
        settle.current = { id: current.id, left: current.left, target, expired: false, stop: () => { drawn.disconnect(); clearTimeout(waited) } }
        if (target !== null) moved.current?.(current.id, target)
        setDropped(count => count + 1)
      }

      // A drag the browser takes away puts the Tab back where it was.
      const cancel = () => {
        const current = drag.current
        if (current !== null && current.started) current.target = current.origin
        finish()
      }

      globalThis.addEventListener("pointermove", moving, true)
      globalThis.addEventListener("pointerup", finish, true)
      globalThis.addEventListener("pointercancel", cancel, true)
      frame = requestAnimationFrame(scroll)
    }
  }), [color, direction, metrics, onClose, onMove, sliding])

  return <DocumentTabsStyleContext.Provider value={context}>
    <AriaDirectionBoundary direction={direction}><AriaTabs
      ref={ref}
      dir={direction}
      className={className}
      {...(value !== undefined ? { selectedKey: value ?? noTab } : {})}
      {...(defaultValue !== undefined ? { defaultSelectedKey: defaultValue } : {})}
      onSelectionChange={key => onChange?.(stringKey(key))}
      style={{ display: "flex", alignItems: "center", gap: metrics.gap, minWidth: 0, fontFamily: "inherit", ...style }}
    >
      <DocumentTabsStrip scroller={scroller} list={list} material={material} following={following} labels={labels}>{children}</DocumentTabsStrip>
      {onAdd !== undefined && <Button iconOnly depth="none" size={size} radius={radius} aria-label={addLabel} onPress={onAdd}><Plus /></Button>}
    </AriaTabs></AriaDirectionBoundary>
  </DocumentTabsStyleContext.Provider>
})

/** Where a Tab stands in its list, in the list's own pixels, wherever the strip is scrolled to or however it is scaled. */
function placeIn(list: HTMLElement, tab: HTMLElement, box = list.getBoundingClientRect(), scale = list.offsetWidth > 0 ? box.width / list.offsetWidth : 1) {
  const rect = tab.getBoundingClientRect()
  return { scale, left: (rect.left - box.left) / (scale || 1), width: rect.width / (scale || 1) }
}

/** The Tabs in their track, which shrink together as more open and then scroll. */
function DocumentTabsStrip({ scroller, list, material, following, labels, children }: Readonly<{
  scroller: RefObject<HTMLDivElement | null>
  list: RefObject<HTMLDivElement | null>
  material: MaterialOverrides["material"]
  following: boolean
  labels: Readonly<{ "aria-label"?: string, "aria-labelledby"?: string }>
  children: ReactNode
}>) {
  const { color, direction, metrics, onClose, onMove } = useDocumentTabsStyle()
  const state = useContext(TabListStateContext)
  const selectedKey = state?.selectedKey
  // The track is as wide as its Tabs at their widest, and gives way down to their narrowest;
  // the Tabs share it evenly, and below that the strip scrolls.
  const count = state?.collection.size ?? 0
  const around = selectionTrackInset * 2 + tabGap * Math.max(0, count - 1)

  // The chosen one comes into view, as far as it must and no further: once it is drawn, as a Tab
  // just opened is drawn after the list.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const view = scroller.current
      const tab = list.current?.querySelector<HTMLElement>("[data-selected]")
      if (!view || !tab) return
      const outer = view.getBoundingClientRect()
      const inner = tab.getBoundingClientRect()
      const scale = view.offsetWidth > 0 ? outer.width / view.offsetWidth : 1
      if (inner.left < outer.left) view.scrollLeft -= (outer.left - inner.left) / scale
      else if (inner.right > outer.right) view.scrollLeft += (inner.right - outer.right) / scale
    })
    return () => cancelAnimationFrame(frame)
  }, [scroller, list, selectedKey, count])

  return <div
    ref={scroller}
    // Before the list hears them: Delete closes the focused Tab, and Ctrl+Shift with an arrow moves it a place.
    onKeyDownCapture={event => {
      const tab = (event.target as HTMLElement).closest<HTMLElement>("[data-document-tab]")
      const id = tab?.dataset.documentTab
      if (!tab || id === undefined || tab.hasAttribute("data-disabled")) return
      if ((event.key === "Delete" || event.key === "Backspace") && tab.hasAttribute("data-closable")) {
        event.preventDefault()
        event.stopPropagation()
        onClose?.(id)
        return
      }
      if (onMove === undefined || !event.shiftKey || !(event.ctrlKey || event.metaKey)) return
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return
      event.preventDefault()
      event.stopPropagation()
      const order = [...list.current?.querySelectorAll<HTMLElement>("[data-document-tab]") ?? []].map(tab => tab.dataset.documentTab)
      const from = order.indexOf(id)
      const to = from + ((event.key === "ArrowRight") === (direction === "ltr") ? 1 : -1)
      if (from >= 0 && to >= 0 && to < order.length) onMove(id, to)
    }}
    onWheel={event => {
      // A wheel that turns up and down scrolls the strip across.
      const view = event.currentTarget
      if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) view.scrollLeft += event.deltaY
    }}
    style={{ display: "flex", flex: "0 1 auto", minWidth: 0, overflowX: "auto", overflowY: "hidden", scrollbarWidth: "none", touchAction: "pan-x" }}
  >
    <SelectionTrack metrics={metrics} color={color} material={material} orientation="horizontal" selectedKey={selectedKey} following={following}
      style={{ flex: "0 1 auto", width: count * metrics.height * widest + around, minWidth: count * metrics.height * narrowest + around, fontSize: metrics.fontSize }}>
      <AriaTabList {...labels} ref={list} data-selection-list="" style={{ position: "relative", display: "flex", gap: tabGap, minWidth: 0 }}>
        {children}
      </AriaTabList>
    </SelectionTrack>
  </div>
}

export interface DocumentTabsTabProps {
  /** Identity of this open thing among the others. */
  readonly id: string
  /** What it is called; cut short where its Tab is narrow. */
  readonly title: string
  /** Shown before the title, such as a page's icon or a session's state. */
  readonly icon?: ReactNode
  /** Whether it can be closed; it can whenever the Tabs close. */
  readonly closable?: boolean
  readonly disabled?: boolean
  readonly className?: string
  readonly style?: CSSProperties
}

const DocumentTabsTab = forwardRef<HTMLDivElement, DocumentTabsTabProps>(function DocumentTabsTab(
  { className, closable = true, disabled = false, icon, id, style, title },
  ref
) {
  const { beginDrag, closes, color, metrics, onClose } = useDocumentTabsStyle()
  const canClose = closes && closable && !disabled

  return <AriaTab
    ref={ref}
    id={id}
    data-document-tab={id}
    data-closable={canClose ? "" : undefined}
    className={state => dimmedClass(state.isDisabled, className ?? state.defaultClassName) ?? ""}
    isDisabled={disabled}
    onPointerDown={event => {
      if (event.button === 1) event.preventDefault()
      // Mouse and pen drag a Tab; a finger scrolls the strip.
      if (!disabled && event.button === 0 && event.pointerType !== "touch") beginDrag(id, event.nativeEvent)
    }}
    onAuxClick={event => {
      if (event.button === 1 && canClose) onClose?.(id)
    }}
    style={state => ({
      ...selectionItemStyle(metrics, color, "horizontal", state),
      justifyContent: "flex-start",
      flex: "1 1 0",
      minWidth: metrics.height * narrowest,
      // The list holds no layer of its own: the Tabs share the track's with the selection, above it at rest.
      zIndex: tabLayer,
      paddingInlineEnd: canClose ? metrics.inset / 2 : metrics.inset,
      ...style
    })}
  >{state => <SelectionItemLabel metrics={metrics} emphasized={state.isSelected || state.isHovered}>
    {icon !== undefined && <span style={{ flex: "none", display: "inline-flex" }}>{icon}</span>}
    <span style={{ flex: "1 1 auto", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", textAlign: "start" }}>{title}</span>
    {canClose && <CloseButton metrics={metrics} shown={state.isSelected || state.isHovered} onClose={() => onClose?.(id)} />}
  </SelectionItemLabel>}</AriaTab>
})

/**
 * Closes its Tab with a click. It is not a control of its own, which a Tab cannot hold: the Tab
 * itself closes with Delete, and assistive technology hears it as the Tab.
 */
function CloseButton({ metrics, shown, onClose }: Readonly<{ metrics: ControlMetrics, shown: boolean, onClose: () => void }>) {
  const [hovered, setHovered] = useState(false)
  const box = Math.round(metrics.height * 0.6)

  return <span
    aria-hidden="true"
    onPointerDown={event => event.stopPropagation()}
    onPointerEnter={() => setHovered(true)}
    onPointerLeave={() => setHovered(false)}
    onClick={event => {
      event.stopPropagation()
      onClose()
    }}
    style={{
      ...transition(metrics.visual, "opacity, background-color"),
      flex: "none",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: box,
      height: box,
      // The Tab's own radius, so it reads as a part of the Tab.
      borderRadius: metrics.radius,
      opacity: shown ? 1 : 0,
      pointerEvents: shown ? "auto" : "none",
      background: hovered ? colorOpacity(metrics.visual.colors.foreground, 0.12) : "transparent",
      cursor: "pointer"
    }}
  ><X size={Math.round(box * 0.7)} /></span>
}

function useDocumentTabsStyle() {
  const context = useContext(DocumentTabsStyleContext)
  if (context == null) throw new Error("DocumentTabs parts must be used inside DocumentTabs")
  return context
}

/** The things open in one place: one chosen, and people open, close, and reorder them. */
export const DocumentTabs = Object.assign(DocumentTabsRoot, {
  Tab: DocumentTabsTab
})
