/**
 * Player settings, kept in the browser storage. Room is left for the next
 * ones (music and effects volumes, language).
 */

export interface Settings {
  /** Multiplies every font size. */
  textSize: number
  /** Multiplies the size of the interface (HUD, menus, bubbles). */
  uiSize: number
}

export interface Choice {
  value: number
  label: string
}

export const TEXT_SIZES: Choice[] = [
  { value: 0.85, label: "Petit" },
  { value: 1, label: "Normal" },
  { value: 1.15, label: "Grand" },
  { value: 1.3, label: "Très grand" },
]

export const UI_SIZES: Choice[] = [0.8, 0.9, 1, 1.15, 1.3].map((value) => ({
  value,
  label: `${Math.round(value * 100)} %`,
}))

export const DEFAULT_SETTINGS: Settings = { textSize: 1, uiSize: 1 }

const KEY = "realms.settings"

/** Only the known values are kept (an old or edited storage is ignored). */
function sanitize(raw: unknown): Settings {
  const out = { ...DEFAULT_SETTINGS }
  if (raw && typeof raw === "object") {
    const r = raw as Partial<Settings>
    if (TEXT_SIZES.some((c) => c.value === r.textSize))
      out.textSize = r.textSize as number
    if (UI_SIZES.some((c) => c.value === r.uiSize))
      out.uiSize = r.uiSize as number
  }
  return out
}

function load(): Settings {
  try {
    const raw = globalThis.localStorage?.getItem(KEY)
    return sanitize(raw ? JSON.parse(raw) : null)
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

let current: Settings = load()

export function settings(): Readonly<Settings> {
  return current
}

export function updateSettings(patch: Partial<Settings>): Settings {
  current = sanitize({ ...current, ...patch })
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(current))
  } catch {
    // storage blocked: the settings last until the page is closed
  }
  return current
}

/** Back to the defaults (tests). */
export function resetSettings() {
  current = { ...DEFAULT_SETTINGS }
  try {
    globalThis.localStorage?.removeItem(KEY)
  } catch {
    // nothing to remove
  }
}

/** The neighbour of a value in a list of choices (‹ › selectors, clamped). */
export function stepChoice(choices: Choice[], value: number, step: number) {
  const i = Math.max(
    0,
    choices.findIndex((c) => c.value === value),
  )
  return choices[Math.max(0, Math.min(choices.length - 1, i + step))].value
}
