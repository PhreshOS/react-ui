# `@phreshos/react-ui`

A React component library for coherent PhreshOS Program interfaces.

## Package status

This package is one component of a larger architecture that is still under
active testing. Its public surface is intentionally small and will grow only as
component contracts are established. It is usable outside a running system,
but its standard Theme contract comes from `@phreshos/core`.

The package is being established from behavior contracts rather than from a
primitive dependency's component catalog. `Button` uses React Aria Components
for normalized pointer, keyboard, focus, disabled, and pending behavior without
exposing that library as the public design language. Components still under
evaluation may compare React Aria Components and Base UI privately in tests.

The library's future icon language has the tree-shakeable public subpath
`@phreshos/react-ui/icons`. That subpath deliberately exports nothing until an
icon source and its contracts have been selected.

`Grid` and `Flex` are appearance-neutral layout primitives. They preserve native
element properties, styles, and refs while naming the layout decisions that are
repeated throughout an interface:

```tsx
<Grid columns="repeat(auto-fit, minmax(12rem, 1fr))" gap="1rem">
  ...
</Grid>

<Flex align="center" justify="between" gap={12} wrap>
  ...
</Flex>
```

Numeric gaps are pixels. Grid dimensions may be positive integer counts or
native CSS track expressions, leaving responsive behavior in CSS instead of
introducing a second breakpoint system.

Inside a `ThemeProvider`, React UI derives its own spacing levels from the
Theme's concrete default spacing:

```tsx
<Flex gap="small">...</Flex>
<Grid gap="large">...</Grid>
```

Structures that own native spacing pass the explicit Theme value to the general
React SDK hook:

```tsx
const spacing = useScale(theme.spacing)

<section style={{ gap: spacing.large }} />
```

Explicit values such as `4rem` are used directly; passing them through a Theme
hook would perform no work.

The Theme stores unrestricted CSS background, foreground, and accent sources.
Core derives the fixed `subtle`, `soft`, `base`, `strong`, and `intense`
treatments from any supplied color, preserving the value exactly at `base`.
`useColor(value)` in the React SDK memoizes that calculation without choosing a
Theme property implicitly. CSS performs nearby mixing in OKLCH, so React UI
does not own or persist a parallel palette:

```tsx
const colors = useColor(theme.accent)

<strong style={{ color: colors.strong }} />
```

`GlassSurface` is the shared translucent material. The Theme supplies its
background, foreground, and concrete default values for distortion, blur,
saturation, brightness, and material opacity. The component derives its tint
from the background and applies the foreground to its content. Accent remains
independent for emphasis and interaction. The surface may also derive a small
or large treatment from each numeric default without turning those levels into
system state.
Derived opacity is capped at thirty percent and never fades the surface's
content. Layout, spacing, radius, and external elevation remain ordinary
container concerns:

```tsx
<GlassSurface className="rounded-xl p-3">
  ...
</GlassSurface>

<GlassSurface color="soft" distortion="large" blur="small" opacity="medium">
  ...
</GlassSurface>
```

Shape-owning components accept the shared `Radius` value directly. Semantic
levels are derived from the Theme's concrete radius through the same `scale()`
rule as spacing, while numbers and CSS values remain explicit overrides:

```tsx
<GlassSurface radius="large">...</GlassSurface>
<GlassSurface radius="2rem">...</GlassSurface>
```

Structures whose native element owns the shape derive from the explicit radius
value through the same general React SDK hook:

```tsx
const radius = useScale(theme.radius)

<section style={{ borderRadius: radius.large }} />
```

`Button` is the first interactive primitive. Its translucent control treatment
matches the desktop's Start and sign-out controls, allowing the surrounding
Theme material to remain visible. It derives spacing and radius from the Theme
while keeping one activation path across pointer, Enter, and Space input:

```tsx
<Button onPress={save}>Save</Button>
<Button size="large" pending>Saving</Button>
<Button disabled>Unavailable</Button>
```

Pending Buttons remain focusable but cannot activate. Disabled Buttons leave
the focus order. The native element defaults to `type="button"`, so placing it
inside a form never submits accidentally.

`ThemeProvider` accepts a plain Theme value, so the library remains usable
without either environment SDK. A Program may adapt its observable Host value
at the application boundary:

```tsx
import { HostProvider, useHostTheme } from "@phreshos/react"
import { ThemeProvider } from "@phreshos/react-ui"

function ThemedApplication({ children }) {
  const theme = useHostTheme()

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>
}

<HostProvider provide={["theme"]} fallback={null}>
  <ThemedApplication>{children}</ThemedApplication>
</HostProvider>
```

## Standing requirements

- Components preserve one recognizable visual identity.
- Customization is limited to supported semantic appearance values.
- `ThemeProvider` requires an explicit `theme` prop; it never discovers an
  environment SDK or silently selects a global theme.
- The provider applies a replacement `theme` value immediately to its descendants.
- Providers are scoped and nestable. The nearest `ThemeProvider` supplies the
  complete theme for its descendants without changing its parent or siblings.
- Accessibility, keyboard behavior, focus, and form behavior are contractual.
- Components must work inside structurally isolated Program iframes.
- Public types and JSDoc are part of the product.

## Development

```bash
node --run check
node --run test
node --run build
```

The acceptance suites compare Button, Field, Select, Dialog, and Context Menu
candidates through the same implementation-independent behaviors. Field covers
labeling, descriptions, validation, native states, and value changes. Select
covers collections, keyboard input, disabled options, form submission, and
cleanup. Dialog covers modal semantics, focus, dismissal, nesting, state changes,
and cleanup. Context Menu covers invocation, focus, actions, disabled items,
dismissal, and cleanup.
