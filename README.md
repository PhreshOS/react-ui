# `@phreshos/react-ui`

Environment-neutral React components and the visual language of PhreshOS.

React UI interprets Core Appearance and Theme contracts. It does not depend on a
Client or Server runtime and does not own authoritative application state.

## Installation

| Package manager | Command |
| --- | --- |
| npm | `npm install @phreshos/react-ui` |
| pnpm | `pnpm add @phreshos/react-ui` |
| Bun | `bun add @phreshos/react-ui` |
| Yarn | `yarn add @phreshos/react-ui` |

`@phreshos/core`, React, and React DOM are peer dependencies.

## Appearance

```tsx
import { standardAppearance } from "@phreshos/core"
import {
  AppearanceProvider,
  Button,
  Surface,
} from "@phreshos/react-ui"

<AppearanceProvider appearance={standardAppearance} theme="light">
  <Surface>
    <Button>Continue</Button>
  </Surface>
</AppearanceProvider>
```

`AppearanceProvider` provides the unresolved Appearance and one effective
`"light" | "dark"` Theme. `useAppearance()` reads the unresolved value,
`useTheme()` reads the effective mode, and `useResolveTheme()` resolves one
themed property where it is consumed.

The provider also applies the shared document scrollbar treatment without
adding a rendered container.

## Components

The package owns the reusable visual primitives used across the desktop and
official Programs:

- `Surface` and `SurfaceMaterial`
- `Button`
- `Flex` and `Grid`
- spacing, scale, radius, color, and icon utilities

These primitives form one visual language. Desktop and Program Views compose
them rather than reimplementing their material or layout behavior.

## Development

```sh
bun install --frozen-lockfile
bun run verify
```

`verify` checks the contracts, tests the components, builds the package, and
validates its public artifact.

## Repository boundary

This repository owns visual interpretation and reusable React components. Core
owns Appearance contracts, React owns runtime-neutral state adaptation, and
applications own composition.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the repository workflow and
[SECURITY.md](SECURITY.md) for private vulnerability reporting.

## License

Licensed under the [MIT License](LICENSE). Copyright © 2026 Zohayr SLILEH.
