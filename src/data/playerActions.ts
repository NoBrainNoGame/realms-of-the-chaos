/**
 * Player actions are actions that can be used by the player. (god actions)
 */
import { CharacterActionOptions } from "../entities/CharacterAction"

const playerActions = {} satisfies Record<string, CharacterActionOptions>

export type PlayerActionName = keyof typeof playerActions

export default playerActions
