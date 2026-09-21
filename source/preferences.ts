import type { DesktopPreferences } from "@phreshos/core"

/** Complete environment preferences consumed by React UI. */
export type Preferences = Pick<DesktopPreferences, "theme" | "animations">

/** At least one preference merged with the nearest UIProvider. */
export type PreferencesUpdate =
  | Readonly<{ theme: Preferences["theme"], animations?: Preferences["animations"] }>
  | Readonly<{ theme?: Preferences["theme"], animations: Preferences["animations"] }>

export type Theme = Preferences["theme"]
