import type { ElementType, ReactElement, Ref } from "react"
import { SurfaceView, type SurfaceInteraction, type SurfaceOwnProps } from "../surface/surface.js"

export type SurfaceRenderProps = SurfaceOwnProps & Readonly<{ interaction?: SurfaceInteraction }>

/**
 * Lets a React Aria component render its own DOM element as a Surface. React
 * Aria keeps behavior, semantics, and state; the Surface owns every paint.
 */
export function surfaceRender<State>(
  as: ElementType,
  derive: (state: State) => SurfaceRenderProps
): (native: object, state: State) => ReactElement {
  return (native, state) => {
    const { ref, ...properties } = native as { ref?: Ref<Element> }
    return <SurfaceView {...properties} {...derive(state)} as={as} ref={ref} />
  }
}
