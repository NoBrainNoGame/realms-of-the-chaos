import ContainerChip from "../parents/ContainerChip"
import Grid from "./Grid"
import * as pixi from "pixi.js"
import * as enums from "../enums"

import Character from "./Character"

// @ts-ignore
import placeholder from "../../assets/images/characters/placeholder.png"

/**
 * Represent a fight between two or more entities. <br>
 * Contains a timeline of actions, clones of fighter characters and a grid.
 */
export default class Fight extends ContainerChip {
  private _grid!: Grid
  private _characters!: Character[]

  protected _onActivate() {
    this._activateChildChip((this._grid = new Grid()))

    this._characters = []

    const character = new Character({
      name: "Placeholder Mage",
      texture: pixi.Texture.from(placeholder),
      class: enums.CharacterClass.MAGE,
      race: enums.CharacterRace.AVENGER_GHOST,
      level: 10,
      distribution: {
        [enums.CharacterSkill.POWER]: 5,
        [enums.CharacterSkill.CHARISMA]: 2,
        [enums.CharacterSkill.INTELLIGENCE]: 3,
      },
    })

    this._grid.addCharacter(character, {
      col: 4,
      row: 5,
    })

    this._characters.push(character)
  }

  protected _onTerminate() {}
}
