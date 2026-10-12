/**
 * How much the page's CSS `zoom` enlarges what is drawn in a floating layer's container: 1 where
 * nothing is zoomed. React Aria places a floating layer in the screen's own pixels, which a zoomed
 * container would enlarge again, so the layer cancels the zoom on itself and gives it back to what it
 * holds: it stands where React Aria put it, at the size of everything around it.
 */
export function containerZoom(container: Element | undefined): number {
  if (!container) return 1
  const zoom = (container as Element & { currentCSSZoom?: number }).currentCSSZoom
  if (typeof zoom === "number" && zoom > 0) return zoom
  // Browsers without currentCSSZoom: the drawn width against the laid-out one.
  const element = container as HTMLElement
  return element.offsetWidth > 0 ? element.getBoundingClientRect().width / element.offsetWidth : 1
}
