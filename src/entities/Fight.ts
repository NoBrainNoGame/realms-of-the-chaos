import * as booyah from "@ghom/booyah"

import ContainerChip from "../parents/ContainerChip"
import Character from "./Character"
import Grid from "./Grid"

/**
 * Represent a fight between two or more entities. <br>
 * Contains a timeline of actions, clones of fighter characters and a grid.
 */
export default class Fight extends ContainerChip {
  private _grid!: Grid
  private _animations!: booyah.Queue

  constructor(private _teams: Character[][]) {
    super()
  }

  protected _onActivate() {
    this._activateChildChip((this._grid = new Grid()))

    // for TESTS

    // this._subscribe(this._grid, "leftClick", (cell) => {
    //   if (cell.hasCharacter()) {
    //     cell.removeCharacters()
    //   } else {
    //     this._grid.shockWave(cell.hex)
    //   }
    // })
    //
    // this._subscribe(this._grid, "rightClick", (cell) => {
    //   const character = makePlaceholderCharacter()
    //
    //   this._characters.push(character)
    //
    //   this._grid.addCharacter(character, cell.hex)
    // })
  }

  protected _onTick() {
    if (this._animations.length === 0) {
      this._teams.forEach((team) => {
        team.forEach((character) => character.timelineTick(this._animations))
      })
    }
  }

  protected _onTerminate() {}
}
