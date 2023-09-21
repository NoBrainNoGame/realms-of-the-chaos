import * as pixi from "pixi.js"
import * as booyah from "@ghom/booyah"
import * as hex from "honeycomb-grid"
import * as constants from "../constants"

import ContainerChip from "../extensions/ContainerChip"
import Character from "./Character"
import GridCell from "./GridCell"
import Fight from "./Fight"
import Grid from "./Grid"

export default class PlayerTurn extends ContainerChip {
  constructor(
    private _character: Character,
    private _fight: Fight,
    private _turnType: "move" | "action",
  ) {
    super()
  }

  protected _onActivate() {
    // En fonction de ce que le player fait on ajoute du temps d'action au character via addActionTime
    // et on lance une animation via this._animations.add

    // todo: séparer le cas d'un move et celui d'une action.

    // highlight character cell

    this._character.highlight()

    if (this._turnType === "move") {
      // init move listeners

      // todo: detect reachable zone with the path finder (grid.getReachableCellsByRange)
      // todo: follow the doc tu refactor this

      this._subscribe(this._fight.grid, "drop", (fromCell, toCell) => {
        // check if the fromCell is the cell of current character
        if (this._character.cell !== fromCell) return

        const reachableCells = this._fight.grid.getNeighborsByRange(
          fromCell.hex,
          constants.characterMaxDistanceMove,
        )

        if (!reachableCells.includes(toCell)) return

        const closeCharacters = this._fight.characters.filter(
          (character) =>
            character !== this._character && character.cell === toCell,
        )

        if (closeCharacters.length >= constants.maxCharacterCountPerCell) return

        const distance = this._fight.grid.getDistanceBetween(
          fromCell.hex,
          toCell.hex,
        )

        this._fight.animations.add(() =>
          this._character.moveAction(toCell, distance),
        )

        this.terminate()
      })

      // display character possible moves on pressing character cell

      this._subscribe(this._fight.grid, "dragStart", (cell: GridCell) => {
        if (this._character.cell !== cell) return

        const reachableCells = this._fight.grid.getNeighborsByRange(
          cell.hex,
          constants.characterMaxDistanceMove,
        )

        reachableCells.forEach((cell) => cell.highlight())

        this._subscribeOnce(cell, "dragEnd", () => {
          reachableCells.forEach((cell) => cell.unHighlight())
        })
      })
    } else {
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
              characters: this._fight.characters,
              animations: this._fight.animations,
              grid: this._fight.grid,
              animationContainer: this._fight.animationContainer,
            },
          },
        )
      })
    }
  }

  protected _onTerminate() {
    this._character.unHighlight()
  }
}
