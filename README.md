# `@phreshos/react-ui`

Environment-neutral React components and visual interpretation for PhreshOS.
The package depends on React and Core contracts, not on either execution SDK.

## Appearance composition

React UI receives complete unresolved `Appearance` plus one effective
`"light" | "dark"` Theme:

```tsx
import { standardAppearance } from "@phreshos/core"
import { AppearanceProvider, Button, Surface } from "@phreshos/react-ui"

export function Example() {
  return <AppearanceProvider appearance={standardAppearance} theme="light">
    <Surface><Button>Continue</Button></Surface>
  </AppearanceProvider>
}
```

`useAppearance()` returns the unresolved value. `useTheme()` returns only the
effective mode. `useResolveTheme(themed)` resolves one property at the point
where it is consumed. Components follow the same rule, so the provider never
collapses Appearance into a second retained object.

An application using the Client SDK composes the packages explicitly:

```tsx
import { useDesktopPreferences, useSystemAppearance } from "@phreshos/react"

const appearance = useSystemAppearance()
const { theme } = useDesktopPreferences()

return <AppearanceProvider appearance={appearance} theme={theme}>
  {children}
</AppearanceProvider>
```

Document color-scheme negotiation belongs to the System iframe and the Client
HTML document, not to a visual component or React hook.

## Levels

`useScale(value)` and `useColor(value)` derive semantic UI levels from one
concrete value. They do not select an Appearance property or read an
environment. Components resolve the property they need first and then derive
their local level.

Layout primitives accept native values without a provider. Semantic gaps and
radii require Appearance because their concrete source is `spacing` or
`radius`.

## Surface

`Surface` is the shared visual material. It accepts native `div` properties
plus local overrides for color, grain, grain amount, backdrop blur, opacity,
distortion, waves, ripples, saturation, and brightness. Omitted controls derive
from the resolved Appearance. A zero-valued optional effect is omitted from the
rendered material so disabled work costs nothing.

Each Surface owns its SVG material while the Surface element itself carries
its border. Backdrop refraction and frost remain separate compositor layers.
Radius and foreground resolve from Appearance; elevation stays with the
surrounding layout. Caller CSS may override the border directly.

## Components

- `Surface`: shared material container.
- `Button`: normalized React Aria action with pending and disabled states.
- `Flex` and `Grid`: small layout primitives that preserve native props.
- `AppearanceProvider`, `useAppearance`, `useTheme`, `useResolveTheme`:
  environment-neutral appearance composition.
- `useScale`, `useColor`, `resolveSpacing`, `resolveRadius`: explicit visual
  derivation helpers.
