# `@phreshos/react-ui`

Environment-neutral React components and the visual language of PhreshOS.

[Appearance](https://docs.phreshos.com/system/appearance) ·
[React SDK](https://docs.phreshos.com/sdks/react) ·
[Source](https://github.com/PhreshOS/react-ui)

## Role

React UI interprets Core Appearance and Theme contracts as reusable visual
primitives. The Desktop and Programs compose those primitives instead of
reimplementing material, spacing, color, radius, or interaction behavior.

The package does not depend on a Client or Server runtime and does not own
authoritative application state. React owns runtime-neutral state adaptation;
applications own composition.

## Installation

| Package manager | Command |
| --- | --- |
| npm | `npm install @phreshos/react-ui` |
| pnpm | `pnpm add @phreshos/react-ui` |
| Bun | `bun add @phreshos/react-ui` |
| Yarn | `yarn add @phreshos/react-ui` |

`@phreshos/core`, React, and React DOM are peer dependencies.

```tsx
import { standardAppearance } from "@phreshos/core"
import { AppearanceProvider, Button, Surface } from "@phreshos/react-ui"

<AppearanceProvider appearance={standardAppearance} theme="light">
  <Surface>
    <Button>Continue</Button>
  </Surface>
</AppearanceProvider>
```

See [Appearance](https://docs.phreshos.com/system/appearance) for the contract
interpreted by the provider and components.

`Button` uses a flat fill with no glass, gradient, or shadow. Omit `color` for
background and foreground, or select `primary`, `secondary`, `success`,
`warning`, `danger`, or `info` for a palette-tinted fill. Text uses foreground.
`size` accepts `xsmall`, `small`, `medium` (default), `large`, or `xlarge`;
spacing and radius follow Appearance. `disabled` prevents activation and focus;
`pending` prevents activation while retaining focus.

```tsx
<Button>Cancel</Button>
<Button color="primary" onPress={save}>Save</Button>
<Button color="danger" size="small">Delete</Button>
```

`Panel` composes an outer `Surface`, an optional header, and an inset content
`Surface`. Both materials retain Surface defaults; the content inset follows
Appearance spacing. Positioning, modality, and lifecycle belong to the caller.

```tsx
import { Panel } from "@phreshos/react-ui"

<Panel header={<h2>Title</h2>} contentProps={{ style: { padding: 16 } }}>
  Content
</Panel>
```

Native properties and the forwarded ref target the outer Surface.
`contentProps` targets the inner Surface; `children` supplies its content.

## Development

```sh
bun install --frozen-lockfile
bun run verify
```

`verify` checks the contracts, tests the components, builds the package, and
validates its published shape.

## Related repositories

- [`@phreshos/core`](https://github.com/PhreshOS/core) owns Appearance, Theme,
  and the shared values interpreted here.
- [`@phreshos/react`](https://github.com/PhreshOS/react) owns runtime-neutral
  React state adaptation.
- [PhreshOS System](https://github.com/PhreshOS/system) composes the visual
  language into the Desktop.
- [Settings](https://github.com/PhreshOS/settings-program) presents owner-facing
  Appearance controls.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the repository workflow and
[SECURITY.md](SECURITY.md) for private vulnerability reporting.

## License

Licensed under the [MIT License](LICENSE). Copyright © 2026 Zohayr SLILEH.
