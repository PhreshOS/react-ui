import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import manifest from "../package.json" with { type: "json" }

const repository = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const temporary = mkdtempSync(join(tmpdir(), "phreshos-react-ui-package-"))
const cache = join(temporary, "npm-cache")
const corePackage = process.env.PHRESHOS_CORE_PACKAGE ?? `@phreshos/core@${manifest.dependencies["@phreshos/core"]}`

assert.equal(typeof manifest.dependencies["@phreshos/core"], "string")
assert.equal(manifest.peerDependencies["@phreshos/core"], undefined)

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
  assert(paths.has("dist/panel.js"), "the package has no Panel implementation")
  assert(paths.has("dist/panel.d.ts"), "the package has no Panel contract")
  for (const name of ["input", "textarea", "checkbox", "radio", "switch", "select", "slider"]) {
    assert(paths.has(`dist/${name}.js`), `the package has no ${name} implementation`)
    assert(paths.has(`dist/${name}.d.ts`), `the package has no ${name} contract`)
  }
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
      corePackage,
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
import { defaultAppearance as coreDefaultAppearance } from "@phreshos/core"
import * as icons from "@phreshos/react-ui/icons"
import {
  Button,
  Flex,
  Grid,
  Panel,
  Surface,
  Input, Textarea, Checkbox, Radio, RadioGroup, Switch, Select, Slider,
  AppearanceProvider,
  defaultAppearance,
  resolveRadius,
  resolveSpacing,
  useColor,
  useScale
} from "@phreshos/react-ui"

for (const exported of [AppearanceProvider, Button, Flex, Grid, Panel, Surface, Input, Textarea, Checkbox, Radio, RadioGroup, Switch, Select, Slider, resolveRadius, resolveSpacing, useColor, useScale]) {
  assert.notEqual(exported, undefined)
}
assert.equal(defaultAppearance, coreDefaultAppearance)
assert.deepEqual(Object.keys(icons), [])
`
  )
  execFileSync(process.execPath, [join(consumer, "runtime.mjs")], { stdio: "inherit" })

  writeFileSync(
    join(consumer, "consumer.tsx"),
    `import { AppearanceProvider, Button, Flex, Grid, Panel, Surface, Input, Textarea, Checkbox, Radio, RadioGroup, Switch, Select, Slider, defaultAppearance, useColor, useScale } from "@phreshos/react-ui"

const surface = <Surface as="button" type="button" color="background:soft" material={{ opacity: 0.4 }}>Surface</Surface>
const standalone = <Button>Default Appearance and browser Theme</Button>
const themed = <AppearanceProvider theme="dark"><Surface>Dark subtree</Surface></AppearanceProvider>

function Derived() {
  const spacing = useScale(defaultAppearance.spacing)
  const primary = useColor(defaultAppearance.colors.light.primary)

  return <span style={{ color: primary.base, padding: spacing.small }}>Derived</span>
}

const view = (
  <AppearanceProvider appearance={defaultAppearance} theme="light">
    <Panel header={<h2>Example</h2>} contentProps={{ style: { padding: 12 } }}>
      <Grid columns={2} gap="small">
        <Flex align="center" justify="between">
          <Button onPress={() => undefined} material={{ opacity: "large" }}>Save</Button>
          {surface}
          <Surface color="background:soft" radius={12} material={{ backdrop: 8 }}>Surface</Surface>
          <Derived />
          <Input label="Name" onChange={value => value.toUpperCase()} />
          <Textarea label="Notes" rows={3} />
          <Checkbox label="Remember" onChange={value => !value} />
          <Switch label="Enabled" defaultChecked />
          <RadioGroup label="Mode" defaultValue="one"><Radio label="One" value="one" /></RadioGroup>
          <Select label="Choice" options={[{value: "one", label: "One"}]} onChange={value => value?.toUpperCase()} />
          <Slider label="Volume" onChange={value => value.toFixed(0)} />
        </Flex>
      </Grid>
    </Panel>
  </AppearanceProvider>
)

void view
void standalone
void themed
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
