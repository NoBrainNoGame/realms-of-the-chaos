/**
 * Contains all behavior presets for NPCs
 */

import * as booyah from "@ghom/booyah"

import * as constants from "../constants"
import * as enums from "../enums"

import type { CharacterActionBehavior } from "../entities/Character"

const behaviors = {
  [enums.CharacterBehavior.STANDARD]: ({ fight, character }) => {
    // define a target (the most dangerous enemy)
    const target = fight.characters.sort((a, b) => {
      return a.level === b.level
        ? (a.getStat(enums.CharacterSkill.PHYSICAL_DAMAGE) +
            a.getStat(enums.CharacterSkill.MAGICAL_DAMAGE)) /
            2 -
            (b.getStat(enums.CharacterSkill.PHYSICAL_DAMAGE) +
              b.getStat(enums.CharacterSkill.MAGICAL_DAMAGE)) /
              2
        : b.level - a.level
    })[0]

    if (!target) {
      // todo: do heal or something

      throw new Error("No target found, no action setup in this case yet")
    }

    const distance = fight.grid.getDistanceBetween(
      character.cell!.hex,
      target.cell!.hex,
    )

    // if close enough, attack

    const action = character.actions.find((action) => {
      return action.scope === "enemy" && action.range >= distance
    })

    if (action) {
      // do action
      return {
        timeCost: action.timeCost({
          author: character,
          target: target.cell!,
        }),
        chip: action,
      }
    }

    // else, move closer

    const reachableDistance = Math.min(
      distance,
      constants.characterMaxDistanceMove,
    )

    // todo: use path finder to find the good cell to move to (in line with target)
    // todo: for an advanced version, use a* algorithm to find the best path (avoiding obstacles, etc.)

    const tempGoodCell = target.cell!

    return {
      timeCost: character.latence * reachableDistance,
      chip: character.moveAction(tempGoodCell, reachableDistance),
    }
  },
} satisfies Record<enums.CharacterBehavior, CharacterActionBehavior>

export default behaviors
