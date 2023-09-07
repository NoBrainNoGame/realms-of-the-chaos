import * as booyah from "@ghom/booyah"
import * as hex from "honeycomb-grid"
import * as constants from "../constants"

import ContainerChip from "../extensions/ContainerChip"
import Character from "./Character"
import GridCell from "./GridCell"
import Grid from "./Grid"
import * as pixi from "pixi.js"

export default class PlayerTurn extends ContainerChip {
  constructor(private _character: Character) {
    super()
  }

  public get chipContext(): {
    readonly container: pixi.Container
    readonly grid: Grid
    readonly characters: Character[]
    readonly animations: booyah.Queue
  } & Readonly<Record<string, any>> {
    // @ts-expect-error
    return super.chipContext
  }

  protected _onActivate() {
    // todo: En fonction de ce que le player fait on ajoute du temps d'action au character via addActionTime
    //  et on lance une animation via this._animations.add

    // highlight character cell

    this._character.highlight()

    // init move listeners

    this._subscribe(this.chipContext.grid, "drop", (fromCell, toCell) => {
      // check if the fromCell is the cell of current character
      if (this._character.cell !== fromCell) return

      const reachableCells = this.chipContext.grid
        .getRecursiveNeighbors(fromCell.hex, constants.characterMaxDistanceMove)
        .map((_hex) => this.chipContext.grid.getCell(_hex))

      if (!reachableCells.includes(toCell)) return

      const closeCharacters = this.chipContext.characters.filter(
        (character) =>
          character !== this._character && character.cell === toCell,
      )

      if (closeCharacters.length >= constants.maxCharacterCountPerCell) return

      const distance = this.chipContext.grid.getDistanceBetween(
        fromCell.hex,
        toCell.hex,
      )

      this.chipContext.animations.add(() =>
        this._character.moveAction(toCell, distance),
      )

      this.terminate()
    })

    // display character possible moves on pressing character cell

    this._subscribe(this.chipContext.grid, "dragStart", (cell: GridCell) => {
      if (this._character.cell !== cell) return

      const reachableCells = this.chipContext.grid
        .getRecursiveNeighbors(cell.hex, constants.characterMaxDistanceMove)
        .map((_hex) => this.chipContext.grid.getCell(_hex))

      reachableCells.forEach((cell) => cell.highlight())

      this._subscribeOnce(cell, "dragEnd", () => {
        reachableCells.forEach((cell) => cell.unHighlight())
      })
    })

    // display character possible actions

    this._character.actions.forEach((action) => {
      this._activateChildChip(
        new booyah.Sequence([
          action,
          new booyah.Lambda(() => {
            this.terminate()
          }),
        ]),
        {
          context: {
            character: this._character,
            characters: this.chipContext.characters,
            animations: this.chipContext.animations,
            grid: this.chipContext.grid,
          },
        },
      )
    })
  }

  protected _onTerminate() {
    this._character.unHighlight()
  }
}
