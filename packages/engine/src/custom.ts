/**
 * Characters built by players: a kit (the actions of a reference
 * character) and stats chosen freely, except health, which is solved so
 * the character stays exactly as strong as the reference (see
 * `balance.ts`). Raising an attack lowers health, and the reverse.
 *
 * Everything here is pure, so the server can check a character sent by
 * a client with the same rules as the builder screen.
 */
import { healthFor, presetPower, STAT_LIMITS } from "./balance"
import { CHARACTERS } from "./content"
import type { CharacterPreset, StatName, Stats } from "./types"

/** Stats the player chooses (health follows). */
export const CUSTOM_STATS = [
  "speed",
  "physicalAttack",
  "physicalDefense",
  "magicalAttack",
  "magicalDefense",
  "luck",
] as const satisfies readonly StatName[]

export type CustomStatName = (typeof CUSTOM_STATS)[number]
export type CustomStats = Record<CustomStatName, number>

/** Sliders move by this much. */
export const CUSTOM_STEP = 0.5

/** A character built by a player. */
export interface CustomCharacter {
  name: string
  /** Id of the reference character whose actions it uses. */
  kit: string
  stats: CustomStats
}

/** Name rules (names are picked, never typed, but the server checks). */
export const CUSTOM_NAME = /^[\p{L}][\p{L}' -]{0,19}$/u

/** The chosen stats of the kit's reference character (a starting point). */
export function customDefaults(kit: string): CustomStats {
  const base = kitPreset(kit).stats
  const stats = {} as CustomStats
  for (const name of CUSTOM_STATS) stats[name] = snap(base[name])
  return stats
}

/** Full stats: the chosen ones, and the health that keeps the power. */
export function customStats(kit: string, chosen: CustomStats): Stats {
  const base = kitPreset(kit)
  const stats: Stats = { ...base.stats, ...chosen }
  stats.health = healthFor(stats, base.actions, presetPower(base))
  return stats
}

/**
 * Values `name` can take, the other stats unchanged: within its limits,
 * and keeping health within its own. Every stat adds power, so the higher
 * the stat, the lower the health: the bounds are found by bisection.
 */
export function customRange(
  kit: string,
  chosen: CustomStats,
  name: CustomStatName,
): { min: number; max: number } {
  const limits = STAT_LIMITS[name]
  const health = (value: number) =>
    customStats(kit, { ...chosen, [name]: value }).health
  const { min: low, max: high } = STAT_LIMITS.health
  // the smallest value that does not need too much health
  let min = limits.min
  if (health(min) > high) {
    let a = limits.min
    let b = limits.max
    for (let i = 0; i < 40; i++) {
      const m = (a + b) / 2
      if (health(m) > high) a = m
      else b = m
    }
    min = b
  }
  // the largest value that leaves enough health
  let max = limits.max
  if (health(max) < low) {
    let a = min
    let b = limits.max
    for (let i = 0; i < 40; i++) {
      const m = (a + b) / 2
      if (health(m) < low) b = m
      else a = m
    }
    max = a
  }
  // on the slider's steps, inside the bounds
  return {
    min: Math.ceil(min / CUSTOM_STEP - 1e-9) * CUSTOM_STEP,
    max: Math.floor(max / CUSTOM_STEP + 1e-9) * CUSTOM_STEP,
  }
}

export type CustomCheck =
  | { ok: true; preset: CharacterPreset }
  | { ok: false; reason: string }

/** Checks a character (builder, server) and makes its preset. */
export function checkCustom(character: CustomCharacter): CustomCheck {
  const { name, kit, stats } = character
  if (!CHARACTERS[kit]) return { ok: false, reason: `unknown kit "${kit}"` }
  if (typeof name !== "string" || !CUSTOM_NAME.test(name))
    return { ok: false, reason: "invalid name" }
  for (const stat of CUSTOM_STATS) {
    const value = stats?.[stat]
    const { min, max } = STAT_LIMITS[stat]
    if (typeof value !== "number" || !Number.isFinite(value))
      return { ok: false, reason: `missing ${stat}` }
    if (Math.abs(value / CUSTOM_STEP - Math.round(value / CUSTOM_STEP)) > 1e-9)
      return { ok: false, reason: `${stat} is not on a step` }
    if (value < min || value > max)
      return { ok: false, reason: `${stat} out of bounds` }
  }
  const full = customStats(kit, pick(stats))
  const health = STAT_LIMITS.health
  if (full.health < health.min - 1e-9)
    return { ok: false, reason: "too strong: not enough health left" }
  if (full.health > health.max + 1e-9)
    return { ok: false, reason: "too weak: too much health needed" }
  const base = CHARACTERS[kit]
  return {
    ok: true,
    preset: {
      ...base,
      id: `custom:${name}`,
      name,
      kit,
      stats: full,
    },
  }
}

/** The preset of a valid character (throws otherwise). */
export function customPreset(character: CustomCharacter): CharacterPreset {
  const check = checkCustom(character)
  if (!check.ok) throw new Error(`Invalid character: ${check.reason}`)
  return check.preset
}

function kitPreset(kit: string) {
  const preset = CHARACTERS[kit]
  if (!preset) throw new Error(`Unknown kit "${kit}"`)
  return preset
}

/** Only the chosen stats (a client could send more). */
function pick(stats: CustomStats): CustomStats {
  const out = {} as CustomStats
  for (const name of CUSTOM_STATS) out[name] = stats[name]
  return out
}

function snap(value: number) {
  return Math.round(value / CUSTOM_STEP) * CUSTOM_STEP
}
