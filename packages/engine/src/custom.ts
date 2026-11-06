/**
 * Characters built by players: a kit (the actions of a reference
 * character) and stats chosen freely, except health, which is solved so
 * the character stays exactly as strong as the reference (see
 * `balance.ts`). Raising an attack lowers health, and the reverse.
 *
 * Everything here is pure, so the server can check a character sent by
 * a client with the same rules as the builder screen.
 */
import { healthFor, type Kit, presetPower, STAT_LIMITS } from "./balance"
import { ACTIONS, CHARACTERS, forbiddenAction } from "./content"
import { type CustomLook, checkLook } from "./look"
import { checkSpell, NAME_RULE, type SpellRecipe } from "./spells"
import type {
  ActionDefinition,
  CharacterPreset,
  StatName,
  Stats,
} from "./types"

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
  /**
   * Own spells replacing the kit's actions (the first one is the
   * signature): ids of any reference character's actions, or recipes.
   * Health still follows, so the power stays the reference's.
   */
  spells?: (string | SpellRecipe)[]
  /**
   * How it looks (cosmetic, never affects balance). Absent: the art of
   * its kit.
   */
  look?: CustomLook
}

/** Name rules (names are picked, never typed, but the server checks). */
export const CUSTOM_NAME = NAME_RULE

/** A character has between 1 and this many spells (when it picks them). */
export const MAX_SPELLS = 3

/** Ids of the catalogue actions a character may pick as spells. */
export const PICKABLE_ACTIONS: readonly string[] = [
  ...new Set(Object.values(CHARACTERS).flatMap((c) => c.actions)),
].filter((id) => ACTIONS[id] && !ACTIONS[id].movement)

export type SpellsCheck =
  | { ok: true; ids: string[]; defs: ActionDefinition[] }
  | { ok: false; reason: string }

/** What a caller explicitly allows beyond the public rules. */
export interface CheckOptions {
  /** Accept forbidden actions (vacuum decay) among the spells. */
  forbidden?: boolean
}

/** Checks the picked spells of a character, and builds their actions. */
export function checkSpells(
  spells: unknown,
  options: CheckOptions = {},
): SpellsCheck {
  if (!Array.isArray(spells) || spells.length < 1 || spells.length > MAX_SPELLS)
    return { ok: false, reason: `1 to ${MAX_SPELLS} spells` }
  const defs: ActionDefinition[] = []
  for (const entry of spells) {
    if (typeof entry === "string") {
      const forbidden = options.forbidden ? forbiddenAction(entry) : undefined
      if (forbidden) {
        defs.push(forbidden)
        continue
      }
      if (!PICKABLE_ACTIONS.includes(entry))
        return { ok: false, reason: `unknown action "${entry}"` }
      defs.push(ACTIONS[entry])
    } else {
      const check = checkSpell(entry)
      if (!check.ok) return { ok: false, reason: check.reason }
      defs.push(check.action)
    }
  }
  const ids = defs.map((d) => d.id)
  if (new Set(ids).size !== ids.length)
    return { ok: false, reason: "duplicate spell" }
  return { ok: true, ids, defs }
}

/** The kit a character plays: its spells when it picks some. */
function kitOf(kit: string, spells?: (string | SpellRecipe)[]): Kit {
  if (spells === undefined) return kitPreset(kit).actions
  // internal: the public gate is `checkCustom`, which refuses forbidden spells
  const check = checkSpells(spells, { forbidden: true })
  if (!check.ok) throw new Error(`Invalid spells: ${check.reason}`)
  return check.defs
}

/**
 * The chosen stats of the kit's reference character (a starting point).
 * With own spells, speed and attacks are scaled together until health
 * is the reference's again, so the build starts balanced (when the
 * spells allow it; otherwise it is refused by `checkCustom`).
 */
export function customDefaults(
  kit: string,
  spells?: (string | SpellRecipe)[],
): CustomStats {
  const reference = kitPreset(kit).stats
  const stats = {} as CustomStats
  for (const name of CUSTOM_STATS) stats[name] = snap(reference[name])
  if (spells === undefined) return stats

  const scaled = (factor: number) => {
    const out = { ...stats }
    for (const name of ["speed", "physicalAttack", "magicalAttack"] as const) {
      const { min, max } = STAT_LIMITS[name]
      out[name] = Math.min(max, Math.max(min, snap(stats[name] * factor)))
    }
    return out
  }
  // health falls as the factor grows: bisection on the factor
  let low = 0.3
  let high = 3
  for (let i = 0; i < 30; i++) {
    const middle = (low + high) / 2
    if (customStats(kit, scaled(middle), spells).health > reference.health)
      low = middle
    else high = middle
  }
  return scaled((low + high) / 2)
}

/** Full stats: the chosen ones, and the health that keeps the power. */
export function customStats(
  kit: string,
  chosen: CustomStats,
  spells?: (string | SpellRecipe)[],
): Stats {
  const base = kitPreset(kit)
  const stats: Stats = { ...base.stats, ...chosen }
  stats.health = healthFor(stats, kitOf(kit, spells), presetPower(base))
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
  spells?: (string | SpellRecipe)[],
): { min: number; max: number } {
  const limits = STAT_LIMITS[name]
  const health = (value: number) =>
    customStats(kit, { ...chosen, [name]: value }, spells).health
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

/** Checks a character (builder, server) and makes its preset. Forbidden spells are refused unless `options.forbidden`. */
export function checkCustom(
  character: CustomCharacter,
  options: CheckOptions = {},
): CustomCheck {
  const { name, kit, stats, spells } = character
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
  if (character.look !== undefined) {
    const looked = checkLook(character.look)
    if (!looked.ok) return looked
  }
  let picked: SpellsCheck | null = null
  if (spells !== undefined) {
    picked = checkSpells(spells, options)
    if (!picked.ok) return { ok: false, reason: picked.reason }
  }
  const full = customStats(kit, pick(stats), spells)
  const health = STAT_LIMITS.health
  if (full.health < health.min - 1e-9)
    return { ok: false, reason: "too strong: not enough health left" }
  if (full.health > health.max + 1e-9)
    return { ok: false, reason: "too weak: too much health needed" }
  const base = CHARACTERS[kit]
  const preset: CharacterPreset = {
    ...base,
    id: `custom:${name}`,
    name,
    kit,
    stats: full,
  }
  if (picked?.ok) {
    preset.actions = picked.ids
    // the catalogue's actions resolve by themselves, only spells are carried
    preset.actionDefs = Object.fromEntries(
      picked.defs.filter((d) => !ACTIONS[d.id]).map((d) => [d.id, d]),
    )
  }
  return { ok: true, preset }
}

/** The preset of a valid character (throws otherwise). */
export function customPreset(
  character: CustomCharacter,
  options: CheckOptions = {},
): CharacterPreset {
  const check = checkCustom(character, options)
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
