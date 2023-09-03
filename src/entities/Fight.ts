import ContainerChip from "../parents/ContainerChip"
import Grid from "./Grid"
import * as pixi from "pixi.js"
import * as enums from "../enums"

import Character from "./Character"

// @ts-ignore
import placeholder from "../../assets/images/characters/placeholder.png"

function makePlaceholderCharacter() {
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

    // for TESTS

    this._subscribe(this._grid, "leftClick", (cell) => {
      if (cell.hasCharacter()) {
        cell.removeCharacters()
      } else {
        this._grid.shockWave(cell.hex)
      }
    })

    this._subscribe(this._grid, "rightClick", (cell) => {
      const character = makePlaceholderCharacter()

      this._characters.push(character)

      this._grid.addCharacter(character, cell.hex)
    })
  }

  protected _onTerminate() {}
}
