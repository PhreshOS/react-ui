/** A visual Theme selects one branch of every themed Appearance value. */
export type Theme = "light" | "dark"

/** Complete environment preferences consumed by React UI. */
export type Preferences = Readonly<{
  theme: Theme
  animations: boolean
}>

/** At least one preference merged with the nearest UIProvider. */
export type PreferencesUpdate =
  | Readonly<{ theme: Theme, animations?: boolean }>
  | Readonly<{ theme?: Theme, animations: boolean }>
