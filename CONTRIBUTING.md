# Contributing

React UI owns reusable React components and appearance primitives for PhreshOS
Program interfaces. A component belongs here when its behavior and visual
contract are useful across Programs without depending on Client, Server, or
desktop implementation details.

## Development

Install the pinned toolchain and verify the complete repository:

```sh
bun install --frozen-lockfile
bun run verify
```

`verify` type-checks source and tests, runs the browser-behavior suite, rebuilds
the package, packs the actual publication artifact, installs that artifact in a
temporary consumer, and checks its runtime, TypeScript, and public subpath
entry points.

Public components must preserve native semantics, accessibility, refs, and one
recognizable visual identity. Environment state enters only through explicit
props or providers; React UI does not import Client, Server, React SDK, or
desktop implementation code.

## Pull requests

Explain the shared interface need the change serves, include focused behavior
tests, update public documentation when the contract changes, and keep each
pull request focused on one coherent change.
