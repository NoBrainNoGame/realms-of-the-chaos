import * as pixi from "pixi.js"
import * as booyah from "@ghom/booyah"
import * as constants from "../constants"

import ContainerChip from "../extensions/ContainerChip"
import Character from "./Character"
import GridCell from "./GridCell"
import Fight from "./Fight"
import Grid from "./Grid"

export default class PlayerTurn extends ContainerChip {
  private _reachableCells!: (GridCell | null)[]

  constructor(
    private _character: Character,
    private _fight: Fight,
    private _turnType: "move" | "action",
  ) {
    super()
  }

  protected _onActivate() {
    if (!this._character.cell) {
      this.terminate()
      return
    }

    // En fonction de ce que le player fait on ajoute du temps d'action au character via addActionTime
    // et on lance une animation via this._animations.add

    // todo: séparer le cas d'un move et celui d'une action.

    // highlight character cell

    this._character.highlight()

    if (this._turnType === "move") {
      // highlight reachable cells

      this._reachableCells = this._fight.grid.getNeighbors(
        this._character.cell.cellPosition,
        // 1, //constants.characterMaxDistanceMove,
      )

      this._reachableCells.forEach((cell) => cell?.highlight())

      // init move listeners

      // todo: detect reachable zone with the path finder
      // todo: follow the doc to refactor this

      this._subscribe(this._fight.grid, "dragAndDrop", (fromCell, toCell) => {
        // check if the fromCell is the cell of current character
        if (
          !this._character.cell ||
          this._character.cell !== fromCell ||
          this._character.cell === toCell
        )
          return

        const reachableCells = this._fight.grid
          .getNeighbors(
            fromCell.cellPosition,
            //1, //constants.characterMaxDistanceMove,
          )
          .filter((cell) => cell?.isReachable)

        if (!reachableCells) {
          // todo: add animation to show that any move is not possible
          console.log("no reachable cells")
          return
        }

        if (!reachableCells.includes(toCell)) {
          // todo: add animation to show that the move is not possible
          console.log("not reachable cell")
          return
        }

        const cellCharacters = this._fight.characters.filter(
          (character) =>
            character !== this._character && character.cell === toCell,
        )

        if (cellCharacters.length >= constants.maxCharacterCountPerCell) {
          // todo: add animation to show that the cell is full
          console.log("cell full")
          return
        }

        const distance = this._fight.grid.getDistanceBetween(
          fromCell.cellPosition,
          toCell.cellPosition,
        )

        this._fight.animations.add(() =>
          this._character.moveAction(toCell, distance),
        )

        this.terminate()

        console.log("move")
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
              grid: this._fight.grid,
              character: this._character,
              characters: this._fight.characters,
              animations: this._fight.animations,
              animationContainer: this._fight.animationContainer,
            },
          },
        )
      })
    }
  }

  protected _onTerminate() {
    this._character.unHighlight()

    if (this._turnType === "move") {
      this._reachableCells.forEach((cell) => cell?.unHighlight())
    }
  }
}
