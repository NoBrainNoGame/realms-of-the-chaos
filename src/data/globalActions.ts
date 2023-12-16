/**
 * Global actions are actions that can be used by any character.
 */

import * as pixi from "pixi.js"
import * as booyah from "@ghom/booyah"

// @ts-ignore
import physicalAttack from "../../assets/images/action-icons/physical-attack.png"

import type { CharacterActionOptions } from "../entities/CharacterAction"

import * as rangeZones from "./rangeZones"

const globalActions = {
  kick: {
    name: "kick",
    icon: pixi.Texture.from(physicalAttack),
    timeCost: ({ launcher }) => launcher.latence,
    canBeUsed: () => true,
    behavior: ({ launcher, targetCells, fight }) => {
      return new booyah.Lambda(() => {
        targetCells.forEach((target) => {
          const character = fight.characters.find((c) => c.cell === target)
          if (character) launcher.doPhysicalDamagesTo(character)
        })
      })
    },
    targetType: "character",
    targetZone: rangeZones.target,
    targetZoneRange: 0,
    launchZone: rangeZones.line,
    launchZoneRange: 1,
  },
} satisfies Record<string, Omit<CharacterActionOptions, "launcher">>

export type GlobalActionName = keyof typeof globalActions

export default globalActions
