import type { DesktopPreferences } from "@phreshos/core"

/** Complete environment preferences consumed by React UI. */
export type Preferences = Pick<DesktopPreferences, "theme" | "animations">

export type Theme = Preferences["theme"]
