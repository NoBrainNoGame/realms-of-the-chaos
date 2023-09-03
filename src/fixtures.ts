import * as booyah from "@ghom/booyah"
import * as pixi from "pixi.js"
import * as enums from "./enums"
import * as utils from "./utils"
import Character from "./entities/Character"

// @ts-ignore
import placeholder from "../assets/images/characters/placeholder.png"

export function makeCharacter() {
  return new Character({
    name: "Placeholder Mage",
    texture: pixi.Texture.from(placeholder),
    class: enums.CharacterClass.MAGE,
    race: enums.CharacterRace.AVENGER_GHOST,
    level: 10,
    distribution: {
      [enums.CharacterSkill.MAGICAL_DAMAGE]: 5,
      [enums.CharacterSkill.CHARISMA]: 2,
      [enums.CharacterSkill.INTELLIGENCE]: 3,
    },
  })
}

export function makeTeam(count: number = 3) {
  return utils.times(count, makeCharacter)
}
