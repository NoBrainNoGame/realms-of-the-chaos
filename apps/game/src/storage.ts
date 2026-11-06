/**
 * Small persistent data of the player (browser storage). Every access is
 * guarded: storage can be missing or blocked (private mode, tests).
 */

import { type CustomCharacter, checkCustom } from "@realms/engine"

export interface ArcadeBest {
  score: number
  waves: number
  team: string[]
  /** ISO date of the run. */
  date: string
}

const ARCADE_KEY = "realms.arcade.best"
const CUSTOM_KEY = "realms.custom"
export const MAX_CUSTOMS = 12

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

/** Saved characters of the workshop (invalid entries are dropped). */
export function customCharacters(): CustomCharacter[] {
  const raw = read<unknown>(CUSTOM_KEY)
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const out: CustomCharacter[] = []
  for (const entry of raw) {
    try {
      if (!entry || !checkCustom(entry as CustomCharacter).ok) continue
    } catch {
      continue
    }
    const c = entry as CustomCharacter
    if (seen.has(c.name)) continue
    seen.add(c.name)
    out.push(c)
  }
  return out.slice(0, MAX_CUSTOMS)
}

/** Saves a character, replacing the one of the same name (12 at most). */
export function saveCustom(character: CustomCharacter) {
  const list = customCharacters()
  const index = list.findIndex((c) => c.name === character.name)
  if (index >= 0) list[index] = character
  else list.push(character)
  write(CUSTOM_KEY, list.slice(-MAX_CUSTOMS))
}

export function deleteCustom(name: string) {
  write(
    CUSTOM_KEY,
    customCharacters().filter((c) => c.name !== name),
  )
}

/** The stored character of a "custom:name" preset id, if it still exists. */
export function customById(id: string): CustomCharacter | undefined {
  return customCharacters().find((c) => customId(c.name) === id)
}

export const customId = (name: string) => `custom:${name}`
export const isCustomId = (id: string) => id.startsWith("custom:")

export function clearStorage() {
  try {
    globalThis.localStorage?.removeItem(ARCADE_KEY)
    globalThis.localStorage?.removeItem(CUSTOM_KEY)
  } catch {
    // nothing to clear
  }
}
