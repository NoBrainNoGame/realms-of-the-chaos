/**
 * Texts of the gameplay information (actions, statuses, stats, divine
 * powers), marked up with the meaning colors of the theme so every number
 * tells at a glance what it is: red damage, green healing and hit points,
 * blue moves, purple poison, yellow time, cyan shields, orange reach, pink
 * luck, lavender Élan. Rendered by `richText`.
 */
import {
  type ActionDefinition,
  type Combat,
  type DivineActionDefinition,
  type Effect,
  type Fighter,
  STATUSES,
  STEP_DELAY_RATIO,
  type StatusId,
} from "@realms/engine"
import { MEANING, type Meaning, tinted } from "./theme"
import { tag } from "./ui"

/** Meaning color of each status (its dot on the fighter, its name). */
export const STATUS_MEANING: Record<StatusId, Meaning> = {
  poisoned: "poison",
  slowed: "time",
  hasted: "time",
  shielded: "shield",
  enraged: "damage",
}

/** Dot color of each status on the fighters (slowed: a darker yellow). */
export const STATUS_COLORS: Record<StatusId, number> = {
  // read when drawn: the scars drift the palettes after this module loads
  get poisoned() {
    return MEANING.poison
  },
  get slowed() {
    return tinted(0xc29200)
  },
  get hasted() {
    return MEANING.time
  },
  get shielded() {
    return MEANING.shield
  },
  get enraged() {
    return MEANING.damage
  },
}

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? "s" : ""}`
const turns = (n: number) => tag("time", plural(n, "tour"))
const cells = (n: number) => tag("move", plural(n, "case"))

/** What a status does, with its duration and value. */
export function describeStatus(
  status: StatusId,
  duration: number,
  value?: number,
) {
  const name = tag(STATUS_MEANING[status], STATUSES[status].name)
  switch (status) {
    case "poisoned":
      return `${name} : ${tag("poison", `-${value ?? 0} PV`)} par tour, ${turns(duration)}`
    case "slowed":
      return `${name} : ${tag("time", "+50 % de temps")}, ${turns(duration)}`
    case "hasted":
      return `${name} : ${tag("time", "-30 % de temps")}, ${turns(duration)}`
    case "shielded":
      return `${name} : absorbe ${tag("shield", `${value ?? 0} dégâts`)}, ${turns(duration)}`
    case "enraged":
      return `${name} : ${tag("damage", "+50 % de dégâts")} infligés, ${tag("damage", "+20 %")} subis, ${turns(duration)}`
  }
}

/** Damage of an effect before the target's defense (and luck). */
function rawDamage(
  fighter: Fighter,
  kind: "physical" | "magical",
  power: number,
) {
  const attack =
    fighter.stats[kind === "physical" ? "physicalAttack" : "magicalAttack"]
  const dealt = fighter.statuses.reduce(
    (m, s) => m * (STATUSES[s.id].damageDealtMultiplier ?? 1),
    1,
  )
  return Math.round(power * (1 + attack / 10) * dealt)
}

/** One line per effect of an action, with its numbers. */
export function describeEffect(
  effect: Effect,
  combat: Combat,
  fighter: Fighter,
) {
  switch (effect.type) {
    case "damage": {
      const amount = rawDamage(fighter, effect.kind, effect.power)
      const kind = effect.kind === "physical" ? "physiques" : "énergétiques"
      return `${tag("damage", `${amount} dégâts`)} ${kind} (avant défense)`
    }
    case "heal":
      return `Soigne ${tag("heal", `+${combat.estimateHeal(fighter, effect.power)} PV`)}`
    case "selfHeal":
      return `Se soigne de ${tag("heal", `+${combat.estimateHeal(fighter, effect.power)} PV`)}`
    case "push":
      return `Repousse de ${cells(effect.distance)}`
    case "dash":
      return `${tag("move", "Bondit")} sur la case visée`
    case "delay":
      return `${tag("time", `+${effect.amount} temps`)} avant le prochain tour`
    case "status":
      return describeStatus(effect.status, effect.turns, effect.value)
  }
}

/** Tooltip of an action button. */
export function describeAction(
  action: ActionDefinition,
  combat: Combat,
  fighter: Fighter,
) {
  const lines: string[] = []
  lines.push(action.combo ? `${action.name}\n✦ Intrication` : action.name)
  lines.push(action.description)

  if (action.movement) {
    const step = Math.round(
      combat.baseStepDelay(fighter) *
        STEP_DELAY_RATIO *
        combat.delayMultiplier(fighter),
    )
    lines.push(
      `Jusqu'à ${cells(action.movement.reach)} de terrain plat (l'eau et les montées comptent plus), par le chemin le plus rapide, en traversant les alliés (touche C)`,
      `Coût : ${tag("time", "le temps du trajet")} (≈ ${tag("time", `${step} temps`)} par case sur terrain plat), termine le tour`,
    )
    return lines.join("\n")
  }

  for (const effect of action.effects)
    lines.push(`• ${describeEffect(effect, combat, fighter)}`)
  if (action.area) {
    const who =
      action.affects === "all"
        ? " (alliés compris !)"
        : action.affects === "allies"
          ? " (alliés)"
          : action.affects === "enemies"
            ? " (ennemis)"
            : ""
    lines.push(`Zone : ${tag("range", `rayon ${action.area.max}`)}${who}`)
  }

  if (action.launch.shape === "point") lines.push(tag("range", "Sur soi"))
  else {
    const min = action.launch.min ?? 0
    const reach = `Portée ${min}-${action.launch.max}`
    const height =
      action.launch.max > 1 ? " (+1 par niveau au-dessus de la cible)" : ""
    const sight = action.lineOfSight ? `, ${tag("range", "ligne de vue")}` : ""
    lines.push(`${tag("range", reach)}${height}${sight}`)
  }

  const cost = Math.round(
    combat.baseDelay(fighter) *
      action.timeCost *
      combat.delayMultiplier(fighter),
  )
  const cooldown = action.cooldown
    ? ` · recharge ${turns(action.cooldown)}`
    : ""
  lines.push(`Coût : ${tag("time", `${cost} temps`)}${cooldown}`)
  return lines.join("\n")
}

/** Tooltip of a divine power. */
export function describeDivine(divine: DivineActionDefinition) {
  return `${divine.name} — ${tag("elan", `${divine.cost} d'Élan`)}\n${divine.description}`
}

/** The stats of a fighter, each in the color of what it changes. */
export function describeStats(fighter: Fighter) {
  const s = Object.fromEntries(
    Object.entries(fighter.stats).map(([k, v]) => [k, Math.round(v)]),
  ) as Fighter["stats"]
  return [
    `Vitesse ${tag("time", s.speed)}   Chance ${tag("luck", s.luck)}`,
    `Atq. phys. ${tag("damage", s.physicalAttack)}   Déf. ${tag("shield", s.physicalDefense)}`,
    `Atq. én. ${tag("damage", s.magicalAttack)}   Déf. ${tag("shield", s.magicalDefense)}`,
  ].join("\n")
}

/** Hit points, in the healing color. */
export function describeHp(fighter: Fighter, combat: Combat) {
  return `PV ${tag("heal", `${fighter.hp} / ${combat.maxHp(fighter)}`)}`
}
