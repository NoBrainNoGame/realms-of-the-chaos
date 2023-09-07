import * as booyah from "@ghom/booyah"
import * as pixi from "pixi.js"
import * as enums from "./enums"
import * as utils from "./utils"

// @ts-ignore
import placeholder from "../assets/images/characters/placeholder.png"

// @ts-ignore
import attack from "../assets/images/action-icons/attack.png"

import CharacterAction from "./entities/CharacterAction"
import Character from "./entities/Character"

export function makeCharacter(level = 10) {
  return new Character({
    name: "Placeholder Mage",
    texture: pixi.Texture.from(placeholder),
    class: enums.CharacterClass.MAGE,
    race: enums.CharacterRace.AVENGER_GHOST,
    level,
    distribution: {
      [enums.CharacterSkill.SPEED]: level,
    },
    actions: [
      new CharacterAction({
        name: "Attack",
        icon: pixi.Texture.from(attack),
        timeCost: ({ author }) => author.latence,
        canBeUsed: ({ target }) => Array.isArray(target),
        behavior: ({ target, author }) => {
          if (!Array.isArray(target)) throw new Error("Invalid target")

          return new booyah.Lambda(() => {
            target.forEach(author.doPhysicalDamagesTo.bind(author))
          })
        },
      }),
    ],
  })
}

export function makeTeam(count: number = 3) {
  return utils.times(count, makeCharacter)
}
