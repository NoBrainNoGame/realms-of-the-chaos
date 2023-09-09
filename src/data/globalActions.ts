/**
 * Global actions are actions that can be used by any character.
 */

import * as pixi from "pixi.js"
import * as booyah from "@ghom/booyah"

// @ts-ignore
import physicalAttack from "../../assets/images/action-icons/physical-attack.png"

import type { CharacterActionOptions } from "../entities/CharacterAction"

const globalActions = {
  PhysicalAttack: {
    name: "PhysicalAttack",
    icon: pixi.Texture.from(physicalAttack),
    timeCost: ({ author }) => author.latence,
    canBeUsed: () => true,
    behavior: ({ author, targets }) => {
      return new booyah.Lambda(() => {
        targets.forEach((target) => author.doPhysicalDamagesTo(target))
      })
    },
    scope: "enemy",
    range: 1,
  },
} satisfies Record<string, CharacterActionOptions>

export type GlobalActionName = keyof typeof globalActions

export default globalActions
