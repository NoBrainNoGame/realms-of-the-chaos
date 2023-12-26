/**
 * Contains all the characters presets
 */

import * as pixi from "pixi.js"

//@ts-ignore
import mage from "../../assets/images/characters/mage.png"

//@ts-ignore
import archer from "../../assets/images/characters/archer.png"

import globalActions from "./globalActions"
import CharacterAction from "../entities/CharacterAction"

import type { CharacterProperties } from "../entities/Character"

type CharacterPreset = Omit<CharacterProperties, "level" | "baseStats">

// todo: add character own actions

const characters = {
  Merlin: {
    name: "Merlin",
    texture: pixi.Texture.from(mage),
  },
  Eva: {
    name: "Eva",
    texture: pixi.Texture.from(archer),
  },
} satisfies Record<string, CharacterPreset>

export type CharacterName = keyof typeof characters

export default characters
