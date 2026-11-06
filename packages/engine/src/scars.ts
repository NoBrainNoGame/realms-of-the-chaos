/**
 * Scars: every time a vacuum decay wipes a save, the bubble leaves the
 * physical constants of the Fragment slightly different. A few reference
 * characters get a few stats shifted by a few points, and health is
 * solved again so each keeps exactly the power of the original (see
 * `balance.ts`): the world drifts, its balance does not.
 *
 * Pure and seeded by the scar count, so a given count always gives the
 * same characters. Only offline modes use them: online play (future)
 * stays canonical, whatever the scars of each player.
 */
import { healthFor, presetKit, presetPower, STAT_LIMITS } from "./balance"
import { CHARACTERS } from "./content"
import { CUSTOM_STATS, CUSTOM_STEP } from "./custom"
import { createRng } from "./random"
import type { CharacterPreset, Stats } from "./types"

/** Reference characters touched by each scar. */
export const SCAR_CHARACTERS = { min: 2, max: 3 }
/** Stats shifted on a character by each scar. */
export const SCAR_STATS = { min: 2, max: 3 }
/** A shift is 1 to this many steps (CUSTOM_STEP), up or down. */
export const SCAR_MAX_STEPS = 4
/** However many scars, a stat never drifts further than this from the original. */
export const SCAR_MAX_DRIFT = 3

let cache: { scars: number; presets: Record<string, CharacterPreset> } | null =
  null

/** The reference characters as the scars of this save left them. */
export function scarredCharacters(
  scars: number,
): Record<string, CharacterPreset> {
  const count = Math.max(0, Math.floor(scars))
  if (count === 0) return CHARACTERS
  if (cache?.scars === count) return cache.presets

  const ids = Object.keys(CHARACTERS)
  const targets = Object.fromEntries(
    ids.map((id) => [id, presetPower(CHARACTERS[id])]),
  )
  const presets: Record<string, CharacterPreset> = { ...CHARACTERS }

  for (let scar = 1; scar <= count; scar++) {
    const rng = createRng(0x5ca7_0000 + scar * 7919)
    const pool = [...ids]
    const touched = rng.int(SCAR_CHARACTERS.min, SCAR_CHARACTERS.max)
    for (let i = 0; i < touched && pool.length > 0; i++) {
      const id = pool.splice(rng.int(0, pool.length - 1), 1)[0]
      const original = CHARACTERS[id]
      const current = presets[id]
      const stats: Stats = { ...current.stats }
      const stat = [...CUSTOM_STATS]
      const shifted = rng.int(SCAR_STATS.min, SCAR_STATS.max)
      for (let j = 0; j < shifted; j++) {
        const name = stat.splice(rng.int(0, stat.length - 1), 1)[0]
        const steps = rng.int(1, SCAR_MAX_STEPS) * (rng.chance(0.5) ? 1 : -1)
        const limits = STAT_LIMITS[name]
        const value = stats[name] + steps * CUSTOM_STEP
        stats[name] = Math.max(
          limits.min,
          Math.min(
            limits.max,
            original.stats[name] + SCAR_MAX_DRIFT,
            Math.max(original.stats[name] - SCAR_MAX_DRIFT, value),
          ),
        )
      }
      stats.health = healthFor(stats, presetKit(original), targets[id])
      const within =
        stats.health >= STAT_LIMITS.health.min - 1e-9 &&
        stats.health <= STAT_LIMITS.health.max + 1e-9
      if (within) presets[id] = { ...current, stats }
    }
  }
  cache = { scars: count, presets }
  return presets
}

/** The preset of a reference character, scarred: its id when there are no scars. */
export function scarredFighter(
  id: string,
  scars: number,
): string | CharacterPreset {
  if (!(scars > 0)) return id
  return scarredCharacters(scars)[id] ?? id
}
