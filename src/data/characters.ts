/**
 * Contains all the characters presets
 */

import * as pixi from "pixi.js"
import * as enums from "../enums"

//@ts-ignore
import mage from "../../assets/images/characters/mage.png"

//@ts-ignore
import archer from "../../assets/images/characters/archer.png"

import globalActions from "./globalActions"
import CharacterAction from "../entities/CharacterAction"

import type { CharacterProperties } from "../entities/Character"

type CharacterPreset = Omit<CharacterProperties, "level" | "distribution">

// todo: add character own actions

const characters = {
  Merlin: {
    name: "Merlin",
    texture: pixi.Texture.from(mage),
    class: enums.CharacterClass.MAGE,
    race: enums.CharacterRace.RESILIENT_HUMAN,
  },
  Eva: {
    name: "Eva",
    texture: pixi.Texture.from(archer),
    class: enums.CharacterClass.ARCHER,
    race: enums.CharacterRace.REBEL_NEPHILIM,
  },
} satisfies Record<string, CharacterPreset>

export type CharacterName = keyof typeof characters

export default characters
