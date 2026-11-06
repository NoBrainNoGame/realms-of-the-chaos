/**
 * Spell builder: players compose their own actions from enumerated parts,
 * and the engine prices them. The player never sets the cost: the delay a
 * spell adds to the timeline (`timeCost`) is derived from its parts, so
 * the more powerful a spell, the longer the caster waits, and every
 * drawback (cooldown, line of sight, friendly fire, minimal range…) makes
 * it cheaper.
 *
 * The model is a power law of the value, fitted on the designed spells of the catalogue
 * (see `scripts/spells-fit.ts`):
 *
 *   value = worth × reach × area × flexibility × (no line of sight)
 *           ÷ (cooldown × minimal range × friendly fire)
 *   timeCost = snap(base + slope × value ^ curve)
 *
 * Everything is pure and serialisable: the server checks a recipe sent by
 * a client with `checkSpell`, exactly as the builder screen does.
 */
import { ACTIONS } from "./content"
import { createRng, type Rng } from "./random"
import type {
  ActionDefinition,
  AffectFilter,
  Effect,
  StatusId,
  TargetFilter,
} from "./types"
import { type ZoneSpec, zoneCells } from "./zones"

// ─── Recipes ────────────────────────────────────────────────────────────────

/** Name rules (names are generated, never typed, but the server checks). */
export const NAME_RULE = /^[\p{L}][\p{L}' -]{0,19}$/u

export type SpellEffect =
  | { type: "damage"; kind: "physical" | "magical"; power: number }
  | { type: "heal"; power: number }
  | { type: "push"; distance: number }
  | { type: "status"; status: StatusId; turns: number; value?: number }
  | { type: "delay"; amount: number }

export interface SpellRecipe {
  /** Generated, validated with NAME_RULE. */
  name: string
  target: TargetFilter
  /** Where the spell can be aimed from the caster ("point" for self). */
  launch: { shape: "point" | "diamond" | "line"; min: number; max: number }
  /** Walls block the spell (ignored, and false, when the range is 1). */
  lineOfSight: boolean
  /** Cells hit around the aimed cell (omit for a single cell). */
  area?: {
    shape: "diamond" | "square" | "line" | "diagonal"
    min: 0 | 1
    max: number
  }
  /** Who the area hits (only with an area). */
  affects?: AffectFilter
  /** One or two effects. */
  effects: SpellEffect[]
  /** Own turns before the spell can be used again (0 to 3). */
  cooldown?: number
}

/** Allowed values of every part, in steps (what a builder screen lists). */
export const SPELL_PARTS = {
  targets: ["enemy", "ally", "self", "any", "emptyCell"] as TargetFilter[],
  launchShapes: ["diamond", "line"] as const,
  launchMin: [0, 1, 2, 3],
  launchMax: [1, 2, 3, 4, 5, 6],
  areaShapes: ["diamond", "square", "line", "diagonal"] as const,
  areaMin: [0, 1] as const,
  areaMax: [1, 2],
  affects: ["enemies", "allies", "all"] as AffectFilter[],
  cooldowns: [0, 1, 2, 3],
  effectTypes: ["damage", "heal", "push", "status", "delay"] as const,
  damageKinds: ["physical", "magical"] as const,
  damagePowers: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  healPowers: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  pushDistances: [1, 2, 3],
  delayAmounts: [5, 10, 15, 20, 25],
  statuses: [
    "poisoned",
    "slowed",
    "hasted",
    "shielded",
    "enraged",
  ] as StatusId[],
  statusTurns: {
    poisoned: [1, 2, 3, 4],
    slowed: [1, 2, 3],
    hasted: [1, 2, 3],
    shielded: [1, 2, 3],
    enraged: [1, 2, 3],
  } as Record<StatusId, number[]>,
  /** Poison damage per turn, or shield points (statuses without: none). */
  statusValues: {
    poisoned: [2, 3, 4, 5],
    shielded: [6, 8, 10, 12, 14, 16, 18, 20],
  } as Partial<Record<StatusId, number[]>>,
  maxEffects: 2,
  /** Areas may not hit more cells than this. */
  maxAreaCells: 13,
} as const

/** Statuses that hurt the bearer (aimed at enemies); the others help. */
export const HOSTILE_STATUSES: readonly StatusId[] = ["poisoned", "slowed"]

export function isHostileEffect(effect: SpellEffect | Effect) {
  switch (effect.type) {
    case "damage":
    case "push":
    case "delay":
      return true
    case "status":
      return HOSTILE_STATUSES.includes(effect.status)
    default:
      return false
  }
}

// ─── Cost model ─────────────────────────────────────────────────────────────

/** Fitted weights (`bun run spells:fit` refits them on the catalogue). */
export interface SpellWeights {
  /** timeCost = base + slope × value ^ curve. */
  base: number
  slope: number
  curve: number
  /** Worth of each effect, in points of physical damage. */
  magical: number
  heal: number
  push: number
  slowed: number
  hasted: number
  enraged: number
  poisoned: number
  shielded: number
  /** Shield worth changes by this much per turn around 2 turns. */
  shieldTurn: number
  delay: number
  /** Exponent of the number of cells the launch zone covers (vs 4). */
  reach: number
  /** Exponent of the number of cells the area covers. */
  area: number
  /** Surcharge of a ranged spell that ignores walls. */
  noLineOfSight: number
  /** Surcharge of a spell that needs no unit on its aimed cell. */
  flexible: number
  /** Discounts, per cooldown turn, per cell of minimal range above 1,
   * and for an area that also hits the wrong side. */
  cooldown: number
  minRange: number
  friendlyFire: number
}

export const SPELL_WEIGHTS: SpellWeights = {
  base: 0.261,
  slope: 0.084,
  curve: 1,
  magical: 0.756,
  heal: 0.831,
  push: 0.973,
  slowed: 2.213,
  hasted: 4.112,
  enraged: 3.733,
  poisoned: 0.629,
  shielded: 0.478,
  shieldTurn: 0.15,
  delay: 0.567,
  reach: 0.115,
  area: 0.241,
  noLineOfSight: 0.2,
  flexible: 0.084,
  cooldown: 0.189,
  minRange: 0.12,
  friendlyFire: 0.299,
}

/** Bounds and step of the derived cost. */
export const SPELL_COST = {
  min: 0.4,
  max: 1.6,
  step: 0.01,
}

/** What the cost depends on, read from any action definition. */
export interface SpellFeatures {
  /** Sum of the effects' worth (damage-equivalent points). */
  worth: number
  launchCells: number
  launchMin: number
  /** Ranged (above 1) and ignoring walls. */
  noLineOfSight: boolean
  areaCells: number
  friendlyFire: boolean
  flexible: boolean
  cooldown: number
}

export function effectWorth(
  effect: Effect,
  w: SpellWeights = SPELL_WEIGHTS,
): number {
  switch (effect.type) {
    case "damage":
      return effect.power * (effect.kind === "magical" ? w.magical : 1)
    case "heal":
    case "selfHeal":
      return effect.power * w.heal
    case "push":
      return effect.distance * w.push
    case "delay":
      return effect.amount * w.delay
    case "dash":
      return 0
    case "status": {
      const value = effect.value ?? 0
      switch (effect.status) {
        case "poisoned":
          return value * effect.turns * w.poisoned
        case "shielded":
          return value * w.shielded * (1 + w.shieldTurn * (effect.turns - 2))
        default:
          return effect.turns * w[effect.status]
      }
    }
  }
}

/** Worth of the effects that are neither damage nor healing. */
export function utilityWorth(
  effects: readonly Effect[],
  w: SpellWeights = SPELL_WEIGHTS,
) {
  return effects.reduce(
    (sum, e) =>
      e.type === "damage" || e.type === "heal" || e.type === "selfHeal"
        ? sum
        : sum + effectWorth(e, w),
    0,
  )
}

export function actionFeatures(
  action: ActionDefinition,
  w: SpellWeights = SPELL_WEIGHTS,
): SpellFeatures {
  const origin = { x: 0, y: 0 }
  return {
    worth: action.effects.reduce((sum, e) => sum + effectWorth(e, w), 0),
    launchCells: zoneCells(origin, action.launch).length,
    launchMin: action.launch.min ?? 0,
    noLineOfSight: action.launch.max > 1 && !action.lineOfSight,
    areaCells: action.area ? zoneCells(origin, action.area).length : 1,
    friendlyFire: action.affects === "all",
    flexible: action.target === "any" || action.target === "emptyCell",
    cooldown: action.cooldown ?? 0,
  }
}

/** Power of a spell as a scalar (see the header for the formula). */
export function featureValue(
  f: SpellFeatures,
  w: SpellWeights = SPELL_WEIGHTS,
): number {
  return (
    (f.worth *
      (f.launchCells / 4) ** w.reach *
      f.areaCells ** w.area *
      (f.flexible ? 1 + w.flexible : 1) *
      (f.noLineOfSight ? 1 + w.noLineOfSight : 1)) /
    ((1 + w.cooldown * f.cooldown) *
      (1 + w.minRange * Math.max(0, f.launchMin - 1)) *
      (f.friendlyFire ? 1 + w.friendlyFire : 1))
  )
}

/** Derived cost before snapping and bounds. */
export function featureCost(
  f: SpellFeatures,
  w: SpellWeights = SPELL_WEIGHTS,
): number {
  return w.base + w.slope * featureValue(f, w) ** w.curve
}

const snapCost = (cost: number) =>
  Math.round(cost / SPELL_COST.step) * SPELL_COST.step

// ─── Building ───────────────────────────────────────────────────────────────

const zone = (shape: ZoneSpec["shape"], min: number, max: number): ZoneSpec =>
  shape === "point" ? { shape, max: 0 } : { shape, min, max }

/** The action of a recipe, with a provisional cost (not checked). */
function draftAction(recipe: SpellRecipe): ActionDefinition {
  const action: ActionDefinition = {
    id: `spell:${recipe.name}`,
    name: recipe.name,
    description: describeSpell(recipe),
    launch: zone(recipe.launch.shape, recipe.launch.min, recipe.launch.max),
    lineOfSight: recipe.launch.max > 1 && recipe.lineOfSight,
    target: recipe.target,
    timeCost: 1,
    effects: recipe.effects.map(
      (e) => ({ ...e }) satisfies SpellEffect as Effect,
    ),
  }
  if (recipe.area) {
    action.area = zone(recipe.area.shape, recipe.area.min, recipe.area.max)
    action.affects = recipe.affects
  }
  if (recipe.cooldown) action.cooldown = recipe.cooldown
  return action
}

export interface SpellPreview {
  /** Value of the spell (0 when the recipe is invalid). */
  value: number
  /** Derived cost, snapped but not bounded. */
  rawCost: number
  /** Cost once bounded (what the spell would cost). */
  cost: number
  /** Why the recipe is refused (French), or null when it is fine. */
  reason: string | null
}

/**
 * Live feedback for a builder screen: value and cost even when the recipe
 * is refused for its power (its cost is then above the maximum). Invalid
 * recipes have no value.
 */
export function previewSpell(input: unknown): SpellPreview {
  const invalid = validateRecipe(input)
  if (invalid) return { value: 0, rawCost: 0, cost: 0, reason: invalid }
  const f = actionFeatures(draftAction(input as SpellRecipe))
  const value = featureValue(f)
  const rawCost = snapCost(featureCost(f))
  const cost = Math.min(SPELL_COST.max, Math.max(SPELL_COST.min, rawCost))
  // too strong is refused; too weak is only clamped up to the minimum
  // (a cheap spell is just a weak one, the minimum stops it from spamming)
  const reason =
    rawCost > SPELL_COST.max + 1e-9
      ? "Sort trop puissant : retirez de la puissance ou ajoutez des contraintes."
      : null
  return { value, rawCost, cost, reason }
}

export function spellValue(recipe: SpellRecipe) {
  return previewSpell(recipe).value
}

/** Derived cost of a recipe, within SPELL_COST (not checked for refusal). */
export function spellCost(recipe: SpellRecipe) {
  return previewSpell(recipe).cost
}

export type SpellCheck =
  | { ok: true; action: ActionDefinition; cost: number; value: number }
  | { ok: false; reason: string }

/**
 * Checks a recipe (builder, server) and builds its action. A `timeCost`
 * sent along is ignored: only the recipe's known parts count.
 */
export function checkSpell(input: unknown): SpellCheck {
  const preview = previewSpell(input)
  if (preview.reason) return { ok: false, reason: preview.reason }
  const action = draftAction(input as SpellRecipe)
  action.timeCost = preview.cost
  return { ok: true, action, cost: preview.cost, value: preview.value }
}

/** The action of a valid recipe (throws otherwise). */
export function buildSpell(recipe: SpellRecipe): ActionDefinition {
  const check = checkSpell(recipe)
  if (!check.ok) throw new Error(`Invalid spell: ${check.reason}`)
  return check.action
}

/** Whether an action was built by the spell builder. */
export function isSpell(action: Pick<ActionDefinition, "id">) {
  return action.id.startsWith("spell:")
}

// ─── Validation ─────────────────────────────────────────────────────────────

const oneOf = (list: readonly unknown[], v: unknown) => list.includes(v)

function validateEffect(e: unknown): string | null {
  const bad = "Effet invalide."
  if (!e || typeof e !== "object") return bad
  const x = e as Record<string, unknown>
  switch (x.type) {
    case "damage":
      return oneOf(SPELL_PARTS.damageKinds, x.kind) &&
        oneOf(SPELL_PARTS.damagePowers, x.power)
        ? null
        : bad
    case "heal":
      return oneOf(SPELL_PARTS.healPowers, x.power) ? null : bad
    case "push":
      return oneOf(SPELL_PARTS.pushDistances, x.distance) ? null : bad
    case "delay":
      return oneOf(SPELL_PARTS.delayAmounts, x.amount) ? null : bad
    case "status": {
      if (!oneOf(SPELL_PARTS.statuses, x.status)) return bad
      const id = x.status as StatusId
      if (!oneOf(SPELL_PARTS.statusTurns[id], x.turns)) return bad
      const values = SPELL_PARTS.statusValues[id]
      if (values) return oneOf(values, x.value) ? null : bad
      return x.value === undefined ? null : bad
    }
    default:
      return bad
  }
}

const effectKey = (e: SpellEffect) =>
  e.type === "damage"
    ? `damage:${e.kind}`
    : e.type === "status"
      ? `status:${e.status}`
      : e.type

/** Why a recipe is not buildable (French), or null. Power is not judged. */
function validateRecipe(input: unknown): string | null {
  if (!input || typeof input !== "object") return "Sort invalide."
  const r = input as Partial<SpellRecipe>
  if (typeof r.name !== "string" || !NAME_RULE.test(r.name))
    return "Nom invalide."
  if (!oneOf(SPELL_PARTS.targets, r.target)) return "Cible invalide."

  const { launch } = r
  if (!launch || typeof launch !== "object") return "Portée invalide."
  if (r.target === "self") {
    if (launch.shape !== "point" || launch.min !== 0 || launch.max !== 0)
      return "Un sort sur soi-même n'a pas de portée."
  } else if (
    !oneOf(SPELL_PARTS.launchShapes, launch.shape) ||
    !oneOf(SPELL_PARTS.launchMin, launch.min) ||
    !oneOf(SPELL_PARTS.launchMax, launch.max) ||
    launch.min > launch.max
  ) {
    return "Portée invalide."
  }
  if (typeof r.lineOfSight !== "boolean") return "Ligne de vue invalide."
  if (r.cooldown !== undefined && !oneOf(SPELL_PARTS.cooldowns, r.cooldown))
    return "Recharge invalide."

  if (
    !Array.isArray(r.effects) ||
    r.effects.length < 1 ||
    r.effects.length > SPELL_PARTS.maxEffects
  )
    return "Un sort a un ou deux effets."
  for (const e of r.effects) {
    const bad = validateEffect(e)
    if (bad) return bad
  }
  const keys = r.effects.map(effectKey)
  if (new Set(keys).size !== keys.length) return "Effets en double."
  const hostile = r.effects.filter(isHostileEffect).length
  if (hostile !== 0 && hostile !== r.effects.length)
    return "Un sort ne peut pas mêler effets hostiles et bénéfiques."
  const isHostile = hostile > 0

  if (r.area) {
    const a = r.area
    if (
      !oneOf(SPELL_PARTS.areaShapes, a.shape) ||
      !oneOf(SPELL_PARTS.areaMin, a.min) ||
      !oneOf(SPELL_PARTS.areaMax, a.max)
    )
      return "Zone invalide."
    if (zoneCells({ x: 0, y: 0 }, a).length > SPELL_PARTS.maxAreaCells)
      return "Zone trop grande."
    if (zoneCells({ x: 0, y: 0 }, a).length < 2) return "Zone sans effet."
    if (isHostile && !oneOf(["enemies", "all"], r.affects))
      return "Zone hostile : ennemis ou tous."
    if (!isHostile && !oneOf(["allies", "all"], r.affects))
      return "Zone bénéfique : alliés ou tous."
  } else if (r.affects !== undefined) {
    return "Seule une zone choisit ses victimes."
  }

  if (isHostile) {
    if (r.target === "ally") return "Un sort hostile vise un ennemi."
    if (r.target === "self" && !r.area)
      return "Un sort hostile sur soi-même a besoin d'une zone."
    if (r.target === "emptyCell" && !r.area)
      return "Viser une case vide demande une zone."
  } else if (r.target === "enemy" || r.target === "emptyCell") {
    return "Un sort bénéfique vise un allié ou soi-même."
  }
  return null
}

// ─── Text ───────────────────────────────────────────────────────────────────

function describeEffect(e: SpellEffect): string {
  switch (e.type) {
    case "damage":
      return `${e.power} dégâts ${e.kind === "physical" ? "physiques" : "magiques"}`
    case "heal":
      return `rend ${e.power} PV`
    case "push":
      return `repousse de ${e.distance} case${e.distance > 1 ? "s" : ""}`
    case "delay":
      return `retarde le prochain tour de ${e.amount}`
    case "status": {
      const name = {
        poisoned: "empoisonne",
        slowed: "ralentit",
        hasted: "accélère",
        shielded: "protège",
        enraged: "enrage",
      }[e.status]
      const extra =
        e.status === "poisoned"
          ? ` (${e.value} par tour)`
          : e.status === "shielded"
            ? ` (bouclier de ${e.value})`
            : ""
      return `${name} ${e.turns} tour${e.turns > 1 ? "s" : ""}${extra}`
    }
  }
}

/** French description of a recipe (shown on the action bar). */
export function describeSpell(recipe: SpellRecipe): string {
  const { launch } = recipe
  const parts = [
    `${recipe.effects.map(describeEffect).join(", ")}.`.replace(/^./, (c) =>
      c.toUpperCase(),
    ),
  ]
  if (recipe.target !== "self")
    parts.push(
      `Portée : ${launch.min > 0 ? `${launch.min} à ` : ""}${launch.max} case${launch.max > 1 ? "s" : ""}.`,
    )
  if (launch.max > 1 && recipe.lineOfSight) parts.push("Ligne de vue requise.")
  if (recipe.area) {
    const who = { enemies: "ennemis", allies: "alliés", all: "tous" }[
      recipe.affects ?? "all"
    ]
    parts.push(`Zone : ${who}.`)
  }
  if (recipe.cooldown)
    parts.push(
      `Recharge : ${recipe.cooldown} tour${recipe.cooldown > 1 ? "s" : ""}.`,
    )
  return parts.join(" ")
}

// ─── Generation ─────────────────────────────────────────────────────────────

const NOUNS = [
  "Éclair",
  "Souffle",
  "Trait",
  "Lame",
  "Brume",
  "Onde",
  "Rayon",
  "Voile",
  "Pulsation",
  "Écho",
  "Brasier",
  "Serre",
]
const EPITHETS = [
  "ardent",
  "glacé",
  "sombre",
  "vif",
  "lointain",
  "cristallin",
  "ancien",
  "sourd",
  "pâle",
  "brisé",
  "d'ambre",
  "d'ombre",
]

/** A random name that passes NAME_RULE. */
export function generateSpellName(rng: Rng): string {
  for (;;) {
    const name = `${rng.pick(NOUNS)} ${rng.pick(EPITHETS)}`
    if (NAME_RULE.test(name)) return name
  }
}

function randomExtra(rng: Rng, hostile: boolean): SpellEffect {
  const pick = <T>(list: readonly T[]) => rng.pick(list)
  const roll = rng.next()
  if (hostile) {
    if (roll < 0.3)
      return { type: "push", distance: pick(SPELL_PARTS.pushDistances) }
    if (roll < 0.45)
      return { type: "delay", amount: pick(SPELL_PARTS.delayAmounts) }
    if (roll < 0.75)
      return {
        type: "status",
        status: "slowed",
        turns: pick(SPELL_PARTS.statusTurns.slowed),
      }
    return {
      type: "status",
      status: "poisoned",
      turns: pick(SPELL_PARTS.statusTurns.poisoned),
      value: pick(SPELL_PARTS.statusValues.poisoned ?? [3]),
    }
  }
  if (roll < 0.5)
    return {
      type: "status",
      status: "shielded",
      turns: pick(SPELL_PARTS.statusTurns.shielded),
      value: pick(SPELL_PARTS.statusValues.shielded ?? [10]),
    }
  const status = pick(["hasted", "enraged"] as const)
  return {
    type: "status",
    status,
    turns: pick(SPELL_PARTS.statusTurns[status]),
  }
}

export type SpellKind = "attack" | "support"

/**
 * A random valid spell of a plausible price (same seed, same spell): an
 * attack (a damage spell, sometimes with a second effect and an area) or
 * a support (healing or shielding an ally). Used by tests, and as the
 * "surprise me" of a builder.
 */
export function generateSpell(seed: number, kind?: SpellKind): SpellRecipe {
  const rng = createRng(seed)
  const pick = <T>(list: readonly T[]) => rng.pick(list)
  const attack =
    (kind ?? (rng.chance(0.75) ? "attack" : "support")) === "attack"
  for (let attempt = 0; attempt < 10_000; attempt++) {
    const target: TargetFilter = attack
      ? pick([
          "enemy",
          "enemy",
          "enemy",
          "enemy",
          "any",
          "self",
          "emptyCell",
        ] as const)
      : pick(["ally", "ally", "ally", "self"] as const)
    const self = target === "self"
    const max = self ? 0 : pick(SPELL_PARTS.launchMax.filter((m) => m <= 5))
    const min = self
      ? 0
      : pick(SPELL_PARTS.launchMin.filter((m) => m <= max && m <= 2))
    const effects: SpellEffect[] = attack
      ? [
          {
            type: "damage",
            kind: pick(SPELL_PARTS.damageKinds),
            power: pick(SPELL_PARTS.damagePowers.filter((p) => p <= 10)),
          },
        ]
      : [
          rng.chance(0.6)
            ? { type: "heal", power: pick(SPELL_PARTS.healPowers) }
            : randomExtra(rng, false),
        ]
    if (rng.chance(0.35)) {
      const extra = randomExtra(rng, attack)
      if (!effects.some((e) => effectKey(e) === effectKey(extra)))
        effects.push(extra)
    }
    const recipe: SpellRecipe = {
      name: generateSpellName(rng),
      target,
      launch: self
        ? { shape: "point", min: 0, max: 0 }
        : { shape: pick(SPELL_PARTS.launchShapes), min, max },
      lineOfSight: max > 1 && rng.chance(0.6),
      effects,
    }
    if (rng.chance(self || target === "emptyCell" ? 1 : 0.25)) {
      recipe.area = {
        shape: pick(["diamond", "diamond", "square", "line", "diagonal"]),
        min: self && attack ? 1 : pick([0, 0, 1]),
        max: 1,
      }
      recipe.affects = attack
        ? pick(["enemies", "enemies", "all"] as const)
        : pick(["allies", "allies", "all"] as const)
    }
    const cooldown = pick([0, 0, 1, 2, 3])
    if (cooldown) recipe.cooldown = cooldown
    const preview = previewSpell(recipe)
    // around the catalogue's spells: neither trivial nor at the very top
    if (!preview.reason && preview.rawCost >= 0.6 && preview.rawCost <= 1.3)
      return recipe
  }
  throw new Error(`Could not generate a spell from seed ${seed}`)
}

// ─── Calibration ────────────────────────────────────────────────────────────

/** Catalogue actions the model can price (no movement, no dash). */
export function calibrationSet(): {
  action: ActionDefinition
  features: SpellFeatures
}[] {
  return Object.values(ACTIONS)
    .filter(
      (a) =>
        !a.movement &&
        !a.targetTerrain &&
        a.effects.length > 0 &&
        !a.effects.some((e) => e.type === "dash" || e.type === "selfHeal"),
    )
    .map((action) => ({ action, features: actionFeatures(action) }))
}
