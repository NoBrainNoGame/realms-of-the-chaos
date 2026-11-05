import type { ActionDefinition, Effect, StatusId } from "./types"

const HELPING: StatusId[] = ["shielded", "hasted", "enraged"]

const helps = (e: Effect) =>
  e.type === "heal" ||
  e.type === "selfHeal" ||
  (e.type === "status" && HELPING.includes(e.status))

/**
 * Whether an action only helps (a heal, a shield, a haste…): it is aimed
 * at allies, never hurts. The interface tints its targets as a boon, not
 * as an attack.
 */
export function isSupport(action: ActionDefinition) {
  return (
    action.target !== "enemy" &&
    action.affects !== "enemies" &&
    action.effects.some(helps) &&
    action.effects.every((e) => helps(e) || e.type === "dash")
  )
}
