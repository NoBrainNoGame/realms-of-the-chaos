import * as booyah from "@ghom/booyah"
import * as hex from "honeycomb-grid"
import * as pixi from "pixi.js"
import * as utils from "../utils"

import ContainerChip from "../parents/ContainerChip"
import GridCell from "./GridCell"

export default class Grid extends ContainerChip {
  private _grid!: hex.Grid<hex.Hex>
  private _cells!: GridCell[]

  protected _onActivate() {
    this._grid = new hex.Grid(
      hex.defineHex({
        dimensions: {
          xRadius: 50,
          yRadius: 40,
        },
        orientation: hex.Orientation.POINTY,
      }),
      hex.rectangle({ width: 10, height: 10 }),
    )

    this._cells = []

    this._grid.forEach((hex) => {
      const cell = new GridCell(hex)

      this._cells.push(cell)

      this._activateChildChip(cell)
    })
  }
}
