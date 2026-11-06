/**
 * Small persistent data of the player (browser storage). Every access is
 * guarded: storage can be missing or blocked (private mode, tests).
 */

import type { Carry, Run } from "@realms/adventure"
import {
  type CustomCharacter,
  checkCustom,
  forbiddenAction,
} from "@realms/engine"
import { ENDING_BASCULE, isSecretEnding } from "./endings"

export interface ArcadeBest {
  score: number
  waves: number
  team: string[]
  /** ISO date of the run. */
  date: string
}

/**
 * Every key of the player's save lives under this prefix, so that a vacuum
 * decay (see `vacuumDecayWipe`) wipes them all, future keys included.
 * Never put a setting or the scars under it.
 */
export const SAVE_PREFIX = "realms.save."

/** The keys of the save (add new ones here, under the prefix). */
export const SAVE_KEYS = {
  arcade: `${SAVE_PREFIX}arcade.best`,
  custom: `${SAVE_PREFIX}custom`,
  /** Forbidden actions the player owns (see `grantForbidden`). */
  unlocks: `${SAVE_PREFIX}unlocks`,
  /** The Adventure's progress (see `adventureSave`): a vacuum decay wipes it. */
  adventure: `${SAVE_PREFIX}adventure`,
} as const

/** Survives every wipe: how many vacuum decays this browser has seen. */
export const SCARS_KEY = "realms.scars"

/**
 * Survives every wipe: the secret endings reached (ids of `endings.ts`),
 * which tell the player's next Adventure what the first one taught.
 */
export const ENDINGS_KEY = "realms.endings"

/** Survives every wipe: the ending to congratulate at the next start. */
export const CONGRATULATE_KEY = "realms.congratulate"

/** Keys from before the save had a prefix, moved on first use. */
const LEGACY_KEYS: Record<string, string> = {
  "realms.arcade.best": SAVE_KEYS.arcade,
  "realms.custom": SAVE_KEYS.custom,
}

const ARCADE_KEY = SAVE_KEYS.arcade
const CUSTOM_KEY = SAVE_KEYS.custom
const UNLOCKS_KEY = SAVE_KEYS.unlocks
export const MAX_CUSTOMS = 12

let migrated = false

function migrate() {
  if (migrated) return
  migrated = true
  try {
    const storage = globalThis.localStorage
    if (!storage) return
    for (const [old, key] of Object.entries(LEGACY_KEYS)) {
      const value = storage.getItem(old)
      if (value === null) continue
      if (storage.getItem(key) === null) storage.setItem(key, value)
      storage.removeItem(old)
    }
  } catch {
    // storage blocked: nothing to move
  }
}

function read<T>(key: string): T | null {
  migrate()
  try {
    const raw = globalThis.localStorage?.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  migrate()
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
      if (!entry || !checkCustom(entry as CustomCharacter, allowance()).ok)
        continue
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

// ─── Adventure progress ─────────────────────────────────────────────────────

/** The Adventure's save: part of the save, so a vacuum decay wipes it. */
export interface AdventureSave {
  /** Name of the saved character that plays the hero (none: the default one). */
  hero: string | null
  /** Per chapter id: the state the chapter starts from (unlocked chapters). */
  starts: Record<string, Carry>
  /** Chapters finished at least once. */
  completed: string[]
  /** The chapter in progress, if any (« Reprendre »). */
  run: Run | null
}

export const emptyAdventureSave = (): AdventureSave => ({
  hero: null,
  starts: {},
  completed: [],
  run: null,
})

export function adventureSave(): AdventureSave {
  const raw = read<Partial<AdventureSave>>(SAVE_KEYS.adventure)
  if (!raw || typeof raw !== "object") return emptyAdventureSave()
  return { ...emptyAdventureSave(), ...raw }
}

export function writeAdventureSave(save: AdventureSave) {
  write(SAVE_KEYS.adventure, save)
}

// ─── Forbidden actions ──────────────────────────────────────────────────────

/** Forbidden actions the player owns (ids of FORBIDDEN_ACTIONS). */
export function forbiddenUnlocked(): string[] {
  const raw = read<unknown>(UNLOCKS_KEY)
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (id): id is string => typeof id === "string" && !!forbiddenAction(id),
  )
}

export function hasForbidden(id: string): boolean {
  return forbiddenUnlocked().includes(id)
}

/** Gives the player a forbidden action (the Adventure, or `?grant=`). */
export function grantForbidden(id: string) {
  if (!forbiddenAction(id)) throw new Error(`Unknown forbidden action "${id}"`)
  const owned = forbiddenUnlocked()
  if (!owned.includes(id)) write(UNLOCKS_KEY, [...owned, id])
}

/** What the engine may accept in this save's characters. */
export function allowance() {
  return { forbidden: forbiddenUnlocked().length > 0 }
}

// ─── Secret endings ─────────────────────────────────────────────────────────

/** The secret endings this browser has reached, in order. */
export function endingsSeen(): string[] {
  const raw = read<unknown>(ENDINGS_KEY)
  if (!Array.isArray(raw)) return []
  return raw.filter((id): id is string => typeof id === "string")
}

/** Records an ending for good (no wipe erases it). */
export function markEnding(id: string) {
  if (!isSecretEnding(id)) throw new Error(`Unknown ending "${id}"`)
  const seen = endingsSeen()
  if (!seen.includes(id)) write(ENDINGS_KEY, [...seen, id])
}

/**
 * The second secret ending exists only for a player who reached the first:
 * what the Ghom's failed attempt showed (it wants the universe as it is)
 * opens the negotiation. For the future Adventure engine.
 */
export function secondEndingAvailable(): boolean {
  return endingsSeen().includes(ENDING_BASCULE)
}

/** Asks the next start to congratulate this ending (once). */
export function congratulateNext(id: string) {
  if (isSecretEnding(id)) write(CONGRATULATE_KEY, id)
}

/** The ending to congratulate now, if any; the flag is cleared. */
export function takeCongratulation(): string | null {
  const id = read<unknown>(CONGRATULATE_KEY)
  try {
    globalThis.localStorage?.removeItem(CONGRATULATE_KEY)
  } catch {
    // storage blocked: nothing to clear
  }
  return typeof id === "string" && isSecretEnding(id) ? id : null
}

// ─── Scars and the wipe ─────────────────────────────────────────────────────

/** How many times a vacuum decay wiped the save (0 when never). */
export function scarCount(): number {
  const n = read<unknown>(SCARS_KEY)
  return typeof n === "number" && Number.isInteger(n) && n > 0 ? n : 0
}

/**
 * The vacuum decay used outside the Adventure: erases the whole save (every
 * key under SAVE_PREFIX, and the keys from before it) and leaves one more
 * scar. Settings, the scars and the endings reached are kept. Returns the
 * new scars.
 *
 * With `ending` (the Adventure reaching a secret ending through the spell),
 * the ending is recorded and the next start congratulates it. A wipe
 * without it (skirmish, arcade) congratulates nothing.
 */
export function vacuumDecayWipe(reason: { ending?: string } = {}): number {
  migrate()
  try {
    const storage = globalThis.localStorage
    if (storage) {
      const keys: string[] = []
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i)
        if (key?.startsWith(SAVE_PREFIX) || (key && key in LEGACY_KEYS))
          keys.push(key)
      }
      for (const key of keys) storage.removeItem(key)
    }
  } catch {
    // storage blocked: nothing was kept anyway
  }
  const scars = scarCount() + 1
  write(SCARS_KEY, scars)
  if (reason.ending !== undefined) {
    markEnding(reason.ending)
    congratulateNext(reason.ending)
  }
  return scars
}

/** Empties the save without leaving a scar (tests). */
export function clearStorage() {
  try {
    const storage = globalThis.localStorage
    if (!storage) return
    for (const key of Object.keys(storage)) {
      if (
        key.startsWith(SAVE_PREFIX) ||
        key === SCARS_KEY ||
        key === ENDINGS_KEY ||
        key === CONGRATULATE_KEY ||
        key in LEGACY_KEYS
      )
        storage.removeItem(key)
    }
  } catch {
    // nothing to clear
  }
}
