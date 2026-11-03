/**
 * Balance model: how strong a character is, and how to generate new
 * characters that are exactly as strong as the reference ones.
 *
 * Power follows Lanchester's square law: a fighter is worth its effective
 * hit points (how much damage it takes to kill) times its output (damage
 * or healing per unit of time). Both factors come straight from the
 * engine's formulas, so trading stats against each other is exact:
 * less health means more attack, speed or defense, and the reverse.
 *
 * What a kit (set of actions) is worth relative to another kit is hard to
 * model (range, areas, statuses, how the AI uses them), so it is not
 * modeled: each kit is calibrated by simulation on its reference preset
 * (the existing characters), and generated characters keep the power of
 * the preset whose kit they use.
 */
import { HP_PER_HEALTH } from "./combat"
import { ACTIONS, CHARACTERS } from "./content"
import { createRng } from "./random"
import type {
  ActionDefinition,
  CharacterPreset,
  StatName,
  Stats,
} from "./types"

/** Share of the damage in a fight that is physical (measured). */
export const PHYSICAL_SHARE = 0.75
/** Critical hits deal this much more damage. */
export const CRITICAL_BONUS = 0.5
/** Speed counts more than linearly: it also moves the fighter faster. */
export const SPEED_EXPONENT = 1.25
/** Melee kits must also walk to their targets: speed counts even more. */
export const MELEE_SPEED_EXPONENT = 1.35
/** Attack counts more than linearly (kills sooner, so less damage taken). */
export const ATTACK_EXPONENT = 1.3
/**
 * Health has diminishing returns (overkill, erosion, burst damage): power
 * grows with health to this power, measured by paired simulations.
 */
export const HEALTH_EXPONENT = 0.75
/** Ranged fighters stay behind and take fewer hits: health is worth less. */
export const RANGED_HEALTH_EXPONENT = 0.55
/** Supports (healers) are worth their healing, hardly their own health. */
export const SUPPORT_HEALTH_EXPONENT = 0.3
/**
 * Below this many hit points, a fighter can fall to a single combo or
 * critical hit: every hit point is worth more (fragility penalty).
 */
export const FRAGILE_HP = 60
export const FRAGILITY_EXPONENT = 0.7
/** Healing is worth this much damage. */
export const HEAL_WORTH = 0.8

/** Critical hit chance of a luck stat (same as the engine). */
export function critChance(luck: number) {
  return Math.min(0.5, luck * 0.03)
}

/** Damage needed to kill: hit points weighted by the defenses. */
export function effectiveHp(stats: Stats) {
  const taken =
    PHYSICAL_SHARE * (10 / (10 + stats.physicalDefense)) +
    (1 - PHYSICAL_SHARE) * (10 / (10 + stats.magicalDefense))
  return (stats.health * HP_PER_HEALTH) / taken
}

/**
 * Toughness as it counts in a fight: health with diminishing returns, but
 * a steep penalty when the fighter is fragile.
 */
export function toughness(stats: Stats, actions: readonly string[]) {
  const hp = stats.health * HP_PER_HEALTH
  const exponent = isSupportKit(actions)
    ? SUPPORT_HEALTH_EXPONENT
    : isMeleeKit(actions)
      ? HEALTH_EXPONENT
      : RANGED_HEALTH_EXPONENT
  const fragility = Math.min(1, hp / FRAGILE_HP) ** FRAGILITY_EXPONENT
  return (hp ** exponent * effectiveHp(stats) * fragility) / hp
}

/** Value of one use of an action, given the user's attack stats. */
function actionOutput(action: ActionDefinition, stats: Stats) {
  let value = 0
  for (const effect of action.effects) {
    if (effect.type === "damage") {
      const attack =
        effect.kind === "physical" ? stats.physicalAttack : stats.magicalAttack
      value += effect.power * (1 + attack / 10)
    } else if (effect.type === "heal" || effect.type === "selfHeal") {
      value += effect.power * (1 + stats.magicalAttack / 10) * HEAL_WORTH
    }
  }
  return value
}

/**
 * Output of a kit per unit of time at speed 1: each action weighted by how
 * often it can be used (cooldown), only the stat-dependent part counts.
 */
export function kitOutput(actions: readonly string[], stats: Stats) {
  let total = 0
  let weights = 0
  for (const id of actions) {
    const action = ACTIONS[id]
    const value = actionOutput(action, stats)
    if (value === 0) continue
    const weight = 1 / (1 + (action.cooldown ?? 0))
    total += (weight * value) / action.timeCost
    weights += weight
  }
  return weights === 0 ? 0 : total / weights
}

/** Whether a kit's signature action (its first one) helps allies. */
export function isSupportKit(actions: readonly string[]) {
  return ACTIONS[actions[0]].target === "ally"
}

/** Whether a kit's signature action (its first one) is melee. */
export function isMeleeKit(actions: readonly string[]) {
  return ACTIONS[actions[0]].launch.max <= 1
}

/** Damage (or healing) per unit of time. */
export function output(stats: Stats, actions: readonly string[]) {
  const crit = 1 + critChance(stats.luck) * CRITICAL_BONUS
  const speedExponent = isMeleeKit(actions)
    ? MELEE_SPEED_EXPONENT
    : SPEED_EXPONENT
  return (
    stats.speed ** speedExponent *
    kitOutput(actions, stats) ** ATTACK_EXPONENT *
    crit
  )
}

/** Fighting strength of a character (Lanchester: toughness × output). */
export function power(stats: Stats, actions: readonly string[]) {
  return toughness(stats, actions) * output(stats, actions)
}

/** Power of a preset: every character of a kit must keep this power. */
export function presetPower(preset: CharacterPreset) {
  return power(preset.stats, preset.actions)
}

/**
 * Health that gives `stats` (all other stats unchanged) the wanted power.
 * Power strictly grows with health: solved by bisection.
 */
export function healthFor(
  stats: Stats,
  actions: readonly string[],
  target: number,
) {
  const at = (health: number) => power({ ...stats, health }, actions)
  let low = 0.01
  let high = 1
  while (at(high) < target && high < 1e6) high *= 2
  for (let i = 0; i < 60; i++) {
    const middle = (low + high) / 2
    if (at(middle) < target) low = middle
    else high = middle
  }
  return (low + high) / 2
}

/** Stats a generator may change (health is solved, not drawn). */
const DRAWN_STATS: StatName[] = [
  "speed",
  "physicalAttack",
  "physicalDefense",
  "magicalAttack",
  "magicalDefense",
  "luck",
]

/**
 * Bounds of balanced characters (generated or built by players). Outside,
 * the model no longer holds: below 5 health a fighter falls to one combo,
 * below 3.5 speed it acts too rarely to matter, whatever its other stats.
 */
export const STAT_LIMITS: Record<StatName, { min: number; max: number }> = {
  health: { min: 5, max: 20 },
  speed: { min: 3.5, max: 9 },
  physicalAttack: { min: 1, max: 14 },
  physicalDefense: { min: 1, max: 12 },
  magicalAttack: { min: 1, max: 14 },
  magicalDefense: { min: 1, max: 12 },
  luck: { min: 1, max: 12 },
}

/** Generated stats differ from the preset by at most this factor. */
export const GENERATED_SPREAD = 1.33

/** Whether every stat is within STAT_LIMITS. */
export function withinLimits(stats: Stats) {
  return (Object.keys(STAT_LIMITS) as StatName[]).every(
    (name) =>
      stats[name] >= STAT_LIMITS[name].min - 1e-9 &&
      stats[name] <= STAT_LIMITS[name].max + 1e-9,
  )
}

/**
 * A new character with the kit of `kitId` and random stats, exactly as
 * strong as the reference preset: every stat is scaled by a random factor
 * (up to GENERATED_SPREAD), then health is solved to keep the power. The weaker the
 * rest of the stats, the more health, and the reverse.
 */
export function generateCharacter(
  seed: number,
  kitId?: string,
): CharacterPreset {
  const rng = createRng(seed)
  const kits = Object.keys(CHARACTERS)
  const base = CHARACTERS[kitId ?? rng.pick(kits)]
  const target = presetPower(base)

  for (let attempt = 0; attempt < 100; attempt++) {
    const stats: Stats = { ...base.stats }
    for (const name of DRAWN_STATS) {
      const factor = GENERATED_SPREAD ** (rng.next() * 2 - 1)
      const { min, max } = STAT_LIMITS[name]
      const value = Math.round(base.stats[name] * factor * 10) / 10
      stats[name] = Math.min(max, Math.max(min, value))
    }
    stats.health = healthFor(stats, base.actions, target)
    if (withinLimits(stats)) {
      return {
        ...base,
        id: `${base.id}~${seed}`,
        kit: base.id,
        name: `${base.name} ${seed}`,
        stats,
      }
    }
  }
  throw new Error(`Could not generate a character from kit "${base.id}"`)
}
