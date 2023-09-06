import * as booyah from "@ghom/booyah"
import * as pixi from "pixi.js"
import * as enums from "./enums"
import * as utils from "./utils"
import Character from "./entities/Character"

// @ts-ignore
import placeholder from "../assets/images/characters/placeholder.png"

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
  })
}

export function makeTeam(count: number = 3) {
  return utils.times(count, makeCharacter)
}
