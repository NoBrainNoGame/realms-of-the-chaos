/**
 * Small persistent data of the player (browser storage). Every access is
 * guarded: storage can be missing or blocked (private mode, tests).
 */

export interface ArcadeBest {
  score: number
  waves: number
  team: string[]
  /** ISO date of the run. */
  date: string
}

const ARCADE_KEY = "realms.arcade.best"

function read<T>(key: string): T | null {
  try {
    const raw = globalThis.localStorage?.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  try {
    globalThis.localStorage?.setItem(key, JSON.stringify(value))
  } catch {
    // storage full or blocked: the record is simply not kept
  }
}

export function arcadeBest(): ArcadeBest | null {
  const best = read<ArcadeBest>(ARCADE_KEY)
  return best && typeof best.score === "number" ? best : null
}

/** Keeps the run if it beats the record; returns true for a new record. */
export function submitArcadeScore(run: ArcadeBest): boolean {
  if (run.score <= 0) return false
  const best = arcadeBest()
  if (best && best.score >= run.score) return false
  write(ARCADE_KEY, run)
  return true
}

export function clearStorage() {
  try {
    globalThis.localStorage?.removeItem(ARCADE_KEY)
  } catch {
    // nothing to clear
  }
}
