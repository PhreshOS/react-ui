import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const repository = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const temporary = mkdtempSync(join(tmpdir(), "phreshos-react-ui-package-"))
const cache = join(temporary, "npm-cache")

try {
  const output = execFileSync(
    "npm",
    ["pack", "--json", "--ignore-scripts", "--pack-destination", temporary],
    {
      cwd: repository,
      encoding: "utf8",
      env: { ...process.env, npm_config_cache: cache }
    }
  )
  const packed = JSON.parse(output)[0]
  const paths = new Set(packed.files.map(file => file.path))

  assert(paths.has("dist/main.js"), "the package has no JavaScript entry point")
  assert(paths.has("dist/main.d.ts"), "the package has no declaration entry point")
  assert(paths.has("dist/icons/main.js"), "the package has no JavaScript icons entry point")
  assert(paths.has("dist/icons/main.d.ts"), "the package has no declaration icons entry point")
  assert(paths.has("LICENSE"), "the package has no license")
  assert(paths.has("README.md"), "the package has no README")
  assert(paths.has("package.json"), "the package has no manifest")

  for (const path of paths) {
    assert(
      path === "LICENSE" || path === "README.md" || path === "package.json" || path.startsWith("dist/"),
      `private repository material entered the package: ${path}`
    )
  }

  const consumer = join(temporary, "consumer")
  const archive = join(temporary, packed.filename)

  mkdirSync(consumer)
  writeFileSync(
    join(consumer, "package.json"),
    JSON.stringify({ private: true, type: "module" }, null, 2)
  )
  execFileSync(
    "npm",
    [
      "install",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--no-package-lock",
      archive,
      "@types/react@^19.2.18",
      "@types/react-dom@^19.2.4"
    ],
    {
      cwd: consumer,
      stdio: "inherit",
      env: { ...process.env, npm_config_cache: cache }
    }
  )

  writeFileSync(
    join(consumer, "runtime.mjs"),
    `import assert from "node:assert/strict"
import * as icons from "@phreshos/react-ui/icons"
import {
  Button,
  Flex,
  Grid,
  Surface,
  ThemeProvider,
  resolveRadius,
  resolveSpacing
} from "@phreshos/react-ui"

for (const exported of [Button, Flex, Grid, Surface, ThemeProvider, resolveRadius, resolveSpacing]) {
  assert.notEqual(exported, undefined)
}
assert.deepEqual(Object.keys(icons), [])
`
  )
  execFileSync(process.execPath, [join(consumer, "runtime.mjs")], { stdio: "inherit" })

  writeFileSync(
    join(consumer, "consumer.tsx"),
    `import { standardTheme } from "@phreshos/core"
import { Button, Flex, Grid, Surface, ThemeProvider } from "@phreshos/react-ui"

const view = (
  <ThemeProvider theme={standardTheme}>
    <Surface>
      <Grid columns={2} gap="small">
        <Flex align="center" justify="between">
          <Button onPress={() => undefined}>Save</Button>
        </Flex>
      </Grid>
    </Surface>
  </ThemeProvider>
)

void view
`
  )
  writeFileSync(
    join(consumer, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          jsx: "react-jsx",
          module: "NodeNext",
          moduleResolution: "NodeNext",
          noEmit: true,
          strict: true,
          target: "ESNext"
        },
        include: ["consumer.tsx"]
      },
      null,
      2
    )
  )

  const typescript = resolve(repository, "node_modules/typescript/bin/tsc")
  execFileSync(process.execPath, [typescript, "-p", join(consumer, "tsconfig.json")], {
    cwd: consumer,
    stdio: "inherit"
  })
} finally {
  rmSync(temporary, { recursive: true, force: true })
}
