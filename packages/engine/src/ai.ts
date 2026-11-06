import type { Combat } from "./combat"
import { BLESSING_HEAL, DIVINE_ACTIONS, MAX_ENERGY } from "./content"
import { manhattan, type Point } from "./geometry"
import type { ActionDefinition, Fighter, StatusId } from "./types"

export type AiCommand =
  | { type: "action"; actionId: string; target: Point }
  | { type: "move"; destination: Point }
  | { type: "pass" }

/** Offensive buffs are only worth it with an enemy this close. */
const BUFF_RANGE = 4
/** Below this score, walking somewhere better beats acting now. */
export const MIN_ACTION_SCORE = 2

/** Value of a status for the side receiving it (positive = good for them). */
const STATUS_VALUE: Record<StatusId, (value: number, turns: number) => number> =
  {
    poisoned: (value, turns) => -value * turns * 0.6,
    slowed: () => -6,
    hasted: () => 6,
    shielded: (value) => value * 0.7,
    enraged: () => 7,
  }

/**
 * Score of using `action` on `target` from `origin`, from the point of view
 * of `fighter`. Positive is good. Pure estimation, no randomness.
 */
export function scoreAction(
  combat: Combat,
  fighter: Fighter,
  action: ActionDefinition,
  target: Point,
  origin: Point = fighter.position,
): number {
  const affected = combat.getAffectedFighters(fighter, action, target)
  let score = 0

  for (const effect of action.effects) {
    switch (effect.type) {
      case "damage":
        for (const o of affected) {
          const expected =
            combat.estimateDamage(fighter, o, effect.kind, effect.power) *
            (1 + combat.critChance(fighter) * 0.5)
          const dealt = Math.min(expected, o.hp)
          const kills = expected >= o.hp
          if (combat.isEnemy(fighter, o)) score += dealt + (kills ? 25 : 0)
          else score -= dealt * 1.5 + (kills ? 40 : 0)
        }
        break

      case "heal":
        for (const o of affected) {
          if (combat.isEnemy(fighter, o)) continue
          const missing = combat.maxHp(o) - o.hp
          score += Math.min(missing, combat.estimateHeal(fighter, effect.power))
        }
        break

      case "status":
        for (const o of affected) {
          // do not refresh a status that is still running
          if (combat.hasStatus(o, effect.status)) continue
          let value = STATUS_VALUE[effect.status](
            effect.value ?? 0,
            effect.turns,
          )
          // a shield is worth it on a hurt or threatened ally
          if (effect.status === "shielded") {
            const threatened = combat.aliveFighters.some(
              (e) =>
                combat.isEnemy(o, e) &&
                manhattan(e.position, o.position) <= BUFF_RANGE,
            )
            const hurt = o.hp < combat.maxHp(o) * 0.7
            if (!hurt && !threatened) value = 0
            else if (!hurt) value *= 0.8
          }
          // offensive buffs are wasted far from the fight
          if (effect.status === "enraged" || effect.status === "hasted") {
            const position = o === fighter ? origin : o.position
            const nearEnemy = combat.aliveFighters.some(
              (e) =>
                combat.isEnemy(o, e) &&
                manhattan(e.position, position) <= BUFF_RANGE,
            )
            if (!nearEnemy) value = 0
          }
          score += combat.isEnemy(fighter, o) ? -value : value
        }
        break

      case "push":
        for (const o of affected) if (combat.isEnemy(fighter, o)) score += 2
        break

      case "delay":
        for (const o of affected) {
          score += combat.isEnemy(fighter, o)
            ? effect.amount * 0.3
            : -effect.amount * 0.3
        }
        break

      case "selfHeal": {
        const missing = combat.maxHp(fighter) - fighter.hp
        score += Math.min(missing, combat.estimateHeal(fighter, effect.power))
        break
      }

      case "dash": {
        const enemies = combat.aliveFighters.filter((o) =>
          combat.isEnemy(fighter, o),
        )
        const adjacentBefore = enemies.some(
          (o) => manhattan(o.position, origin) === 1,
        )
        const adjacentAfter = enemies.some(
          (o) => manhattan(o.position, target) === 1,
        )
        if (!adjacentBefore && adjacentAfter) score += 8
        break
      }
    }
  }

  return score / Math.sqrt(action.timeCost)
}

const isForbidden = (action: ActionDefinition) =>
  action.effects.some((e) => e.type === "vacuumDecay")

/** Best (action, target) usable from `origin`, or null. */
export function bestAction(
  combat: Combat,
  fighter: Fighter,
  origin: Point = fighter.position,
): { action: ActionDefinition; target: Point; score: number } | null {
  let best: { action: ActionDefinition; target: Point; score: number } | null =
    null

  for (const action of combat.actionsOf(fighter, origin)) {
    // the AI walks with planned paths; sprinting is a player convenience
    if (action.movement || combat.isOnCooldown(fighter, action)) continue
    // forbidden: the AI never ends the world
    if (isForbidden(action)) continue
    for (const target of combat.getValidTargets(fighter, action, origin)) {
      const score = scoreAction(combat, fighter, action, target, origin)
      if (score >= MIN_ACTION_SCORE && (!best || score > best.score)) {
        best = { action, target, score }
      }
    }
  }

  return best
}

/**
 * Ids of the actions (not movements) usable now that have a worthwhile
 * target: an enemy to hit, an ally who needs care… (HUD suggestions).
 */
export function usefulActions(combat: Combat, fighter: Fighter): string[] {
  return combat
    .actionsOf(fighter)
    .filter(
      (action) =>
        !action.movement &&
        !isForbidden(action) &&
        !combat.isOnCooldown(fighter, action) &&
        combat
          .getValidTargets(fighter, action)
          .some(
            (target) =>
              scoreAction(combat, fighter, action, target) >= MIN_ACTION_SCORE,
          ),
    )
    .map((action) => action.id)
}

/**
 * Divine powers for AI teams: heal the team when it is badly hurt,
 * otherwise spend a full gauge to delay the next enemy.
 */
export function decideDivine(
  combat: Combat,
  fighter: Fighter,
): { divineId: string; target: Point | null } | null {
  const energy = combat.teams[fighter.team].energy
  const allies = combat.aliveFighters.filter((o) => o.team === fighter.team)
  const enemies = combat.aliveFighters.filter((o) => combat.isEnemy(fighter, o))

  const blessing = DIVINE_ACTIONS.blessing
  if (energy >= blessing.cost) {
    const healed = allies.reduce(
      (sum, o) => sum + Math.min(BLESSING_HEAL, combat.maxHp(o) - o.hp),
      0,
    )
    if (healed >= BLESSING_HEAL * Math.min(2, allies.length)) {
      return { divineId: blessing.id, target: null }
    }
  }

  if (energy >= MAX_ENERGY && enemies.length > 0) {
    const next = enemies.reduce((a, b) =>
      b.nextActionAt < a.nextActionAt ? b : a,
    )
    return { divineId: DIVINE_ACTIONS.timeWarp.id, target: next.position }
  }

  return null
}

/**
 * Standard behavior: act if something useful can be done right now,
 * otherwise walk towards the most promising cell and wait.
 */
export function decide(combat: Combat, fighter: Fighter): AiCommand[] {
  const now = bestAction(combat, fighter)
  if (now)
    return [{ type: "action", actionId: now.action.id, target: now.target }]

  const enemies = combat.aliveFighters.filter((o) => combat.isEnemy(fighter, o))
  if (enemies.length === 0) return [{ type: "pass" }]

  const nodes = [...combat.explore(fighter).values()]

  // where could we do the most next turn? (walking cost slightly penalized)
  let destination: Point | null = null
  let bestScore = 0
  for (const node of nodes) {
    const option = bestAction(combat, fighter, node.point)
    if (!option) continue
    const score = option.score - node.cost * 0.5
    if (score > bestScore) {
      bestScore = score
      destination = node.point
    }
  }

  // nothing reachable to do: get closer to the nearest enemy
  if (!destination) {
    let bestDistance = Infinity
    let bestCost = Infinity
    for (const node of nodes) {
      const distance = Math.min(
        ...enemies.map((e) => manhattan(e.position, node.point)),
      )
      if (
        distance < bestDistance ||
        (distance === bestDistance && node.cost < bestCost)
      ) {
        bestDistance = distance
        bestCost = node.cost
        destination = node.point
      }
    }
  }

  const commands: AiCommand[] = []
  if (destination && manhattan(destination, fighter.position) > 0) {
    commands.push({ type: "move", destination })
  }
  commands.push({ type: "pass" })
  return commands
}
