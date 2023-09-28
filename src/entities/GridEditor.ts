import ContainerChip from "../extensions/ContainerChip"
import Grid from "./Grid"

export default class GridEditor extends ContainerChip {
  private _grid!: Grid

  protected _onActivate() {
    this._activateChildChip((this._grid = new Grid()))

    this._subscribe(this._grid, "leftClick", (cell) => {
      // if (cell.hasCharacter()) {
      //   cell.removeCharacters()
      // } else {
      this._grid.shockWave(cell.cellPosition)
      // }
    })

    // this._subscribe(this._grid, "rightClick", (cell) => {
    //   const character = fixtures.makeCharacter()
    //
    //   this._grid.addCharacter(character, cell.hex)
    // })
  }
}
