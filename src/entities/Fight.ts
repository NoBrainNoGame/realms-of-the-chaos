import * as booyah from "@ghom/booyah"
import * as pixi from "pixi.js"

import ContainerChip from "../parents/ContainerChip"
import Character from "./Character"
import Grid from "./Grid"

/**
 * Represent a fight between two or more entities. <br>
 * Contains a timeline of actions, clones of fighter characters and a grid.
 */
export default class Fight extends ContainerChip {
  private _gridContainer!: pixi.Container
  private _hudContainer!: pixi.Container

  private _grid!: Grid
  private _animations!: booyah.Queue

  constructor(private _teams: Character[][]) {
    super()
  }

  protected _onActivate() {
    this._gridContainer = new pixi.Container()
    this._hudContainer = new pixi.Container()

    this._container.addChild(this._gridContainer, this._hudContainer)

    this._activateChildChip((this._grid = new Grid()), {
      context: {
        container: this._gridContainer,
      },
    })

    this._activateChildChip((this._animations = new booyah.Queue()))

    this._subscribe(this._grid, "ready", () => {
      this._teams.forEach((team, teamIndex) => {
        team.forEach((character, characterIndex) => {
          this._grid.addCharacter(
            character,
            this._grid.getPlacement(teamIndex, characterIndex),
          )
        })
      })
    })

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
    if (!this._grid.isReady) return

    // @ts-ignore
    if (this._animations._queue.length === 0) {
      this._teams.forEach((team) => {
        team.forEach((character) => character.timelineTick(this._animations))
      })
    }
  }
}
