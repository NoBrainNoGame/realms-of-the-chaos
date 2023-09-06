import * as booyah from "@ghom/booyah"
import * as hex from "honeycomb-grid"
import * as pixi from "pixi.js"
import * as constants from "../constants"

// @ts-ignore
import hill from "../../assets/images/grid-cells/hill.png"

import GridCell from "./GridCell"
import ContainerChip from "../extensions/ContainerChip"

interface GridEvents extends booyah.BaseCompositeEvents {
  leftClick: [cell: GridCell]
  rightClick: [cell: GridCell]
  dragStart: [cell: GridCell]
  dragEnd: [cell: GridCell]
  drop: [from: GridCell, to: GridCell]
  ready: []
}

export default class Grid extends ContainerChip<GridEvents> {
  private _honeycomb!: hex.Grid<hex.Hex>
  private _cells!: GridCell[]

  protected _onActivate() {
    this._container.sortableChildren = true

    const hillTexture = pixi.Texture.from(hill)

    this._honeycomb = new hex.Grid(
      hex.defineHex({
        dimensions: {
          width: constants.cellWidth,
          height: constants.cellHeight,
        },
        orientation: hex.Orientation.POINTY,
      }),
      hex.rectangle({
        width: constants.gridWidth,
        height: constants.gridHeight,
      }),
    )

    let z = 0

    this._cells = []

    this._honeycomb
      .toArray()
      .sort((a, b) => {
        // first last row, then last col
        return a.row === b.row ? b.col - a.col : b.row - a.row
      })
      .forEach((hex) => {
        const cell = new GridCell(hex, hillTexture, z, hex.row * hex.col * 10)

        this._cells.push(cell)

        this._activateChildChip(cell)

        if (Math.random() < 0.1) {
          z++
        }

        this._subscribe(cell, "leftClick", () => {
          this.emit("leftClick", cell)
        })

        this._subscribe(cell, "rightClick", () => {
          this.emit("rightClick", cell)
        })

        this._subscribe(cell, "dragStart", () => {
          this.emit("dragStart", cell)
        })

        this._subscribe(cell, "dragEnd", (outside: boolean) => {
          this.emit("dragEnd", cell)

          if (outside) {
            const hovered = this.getHoveredCell()

            if (hovered) {
              this.emit("drop", cell, hovered)
            }
          }
        })
      })
  }

  public getPlacement(
    teamIndex: number,
    characterIndex: number,
  ): hex.OffsetCoordinates {
    return {
      col: 2 + teamIndex * (constants.gridWidth - 4),
      row: Math.ceil(constants.gridHeight / 2) + characterIndex,
    }
  }

  public getRandomCell() {
    return this._cells[Math.floor(Math.random() * this._cells.length)]
  }

  public getHoveredCell() {
    return this._cells.find((cell) => cell.isHovered)
  }

  public shockWave(_hex: hex.Hex) {
    const intervals = 200

    const firstNeighbors = this.getNeighbors(_hex)

    const secondNeighbors = firstNeighbors
      .map((__hex) => this.getNeighbors(__hex))
      .flat()
      .filter(
        (__hex) =>
          !firstNeighbors.some((___hex) => ___hex.equals(__hex)) &&
          !__hex.equals(_hex),
      )

    const cells = [
      [this.getCell(_hex)],
      firstNeighbors.map((neighbor) => this.getCell(neighbor)),
      secondNeighbors.map((neighbor) => this.getCell(neighbor)),
    ]

    this._activateChildChip(
      new booyah.Sequence([
        new booyah.Lambda(() => {
          cells[0][0].pulse(1)
        }),
        new booyah.Wait(intervals / 3),
        new booyah.Parallel(
          cells[1].map((cell) => {
            return new booyah.Lambda(() => {
              cell.pulse(0.5)
            })
          }),
        ),
        new booyah.Wait(intervals / 3),
        new booyah.Parallel(
          cells[2].map((cell) => {
            return new booyah.Lambda(() => {
              cell.pulse(0.25)
            })
          }),
        ),
      ]),
    )
  }

  public getNeighbors(_hex: hex.Hex): hex.Hex[] {
    const neighbors = new Array<hex.Hex | undefined>()

    for (let i = 0; i < 8; i++) {
      neighbors.push(
        this._honeycomb.neighborOf(_hex, i, { allowOutside: false }),
      )
    }

    return neighbors.filter((neighbor) => !!neighbor) as hex.Hex[]
  }

  public getRecursiveNeighbors(_hex: hex.Hex, depth: number): hex.Hex[] {
    if (depth === 0) return []

    const neighbors = new Set(this.getNeighbors(_hex))

    for (const neighbor of Array.from(neighbors)) {
      this.getRecursiveNeighbors(neighbor, depth - 1).forEach((neighbor) =>
        neighbors.add(neighbor),
      )
    }

    return Array.from(neighbors)
  }

  public getCell(_hex: hex.OffsetCoordinates) {
    return this._cells.find((cell) => cell.hex.equals(_hex))!
  }

  public getCells() {
    return this._cells
  }

  public getDistanceBetween(a: hex.Hex, b: hex.Hex) {
    return this._honeycomb.distance(a, b)
  }
}
