import * as booyah from "@ghom/booyah"
import * as hex from "honeycomb-grid"
import * as pixi from "pixi.js"
import * as constants from "../constants"

import { DisplacementFilter } from "@pixi/filter-displacement"

// @ts-ignore
import hill from "../../assets/images/grid-cells/hill.png"

// @ts-ignore
import noise from "../../assets/images/displacement_map_repeat.jpg"

import ContainerChip from "../parents/ContainerChip"
import GridCell from "./GridCell"

export default class Grid extends ContainerChip {
  private _grid!: hex.Grid<hex.Hex>
  private _cells!: GridCell[]
  private _centerContainer!: pixi.Container
  private _cellContainer!: pixi.Container
  private _waterContainer!: pixi.Container

  private _waterNoiseSprite?: pixi.Sprite

  protected _onActivate() {
    this._centerContainer = new pixi.Container()
    this._cellContainer = new pixi.Container()
    this._waterContainer = new pixi.Container()

    this._cellContainer.sortableChildren = true
    this._waterContainer.sortableChildren = true

    this._centerContainer.addChild(this._cellContainer, this._waterContainer)

    this._container.addChild(this._centerContainer)

    const hillTexture = pixi.Texture.from(hill)

    this._grid = new hex.Grid(
      hex.defineHex({
        dimensions: {
          width: 100,
          height: 50,
        },
        orientation: hex.Orientation.POINTY,
      }),
      hex.rectangle({
        width: constants.gridWidth,
        height: constants.gridHeight,
      }),
    )

    const center = this._grid.getHex({
      col: Math.floor(constants.gridWidth / 2),
      row: Math.floor(constants.gridHeight / 2),
    })!

    this._centerContainer.position.set(-center.x, -center.y)

    let z = -6

    this._cells = []

    this._grid
      .toArray()
      .sort((a, b) => {
        // first last row, then last col
        return a.row === b.row ? b.col - a.col : b.row - a.row
      })
      .forEach((hex) => {
        const cell = new GridCell(hex, hillTexture, z, this._waterContainer)

        this._cells.push(cell)

        this._activateChildChip(cell, {
          context: {
            container: this._cellContainer,
          },
        })

        if (Math.random() < 0.1) {
          z++
        }

        this._subscribe(cell, "leftClick", () => {
          this._shockWave(hex)
        })
      })

    if (this._waterContainer.children.length > 0) {
      this._waterNoiseSprite = new pixi.Sprite(pixi.Texture.from(noise))
      this._waterNoiseSprite.texture.baseTexture.wrapMode =
        pixi.WRAP_MODES.REPEAT

      const filter = new DisplacementFilter(this._waterNoiseSprite)

      filter.scale.x = 50
      filter.scale.y = 20
      filter.padding = 10

      this._waterContainer.filters = [filter]

      this._centerContainer.addChild(this._waterNoiseSprite)
    }
  }

  protected _onTick() {
    this._container.position.set(
      window.innerWidth / 2 + 25,
      window.innerHeight / 2,
    )

    if (this._waterNoiseSprite) {
      this._waterNoiseSprite.x += 0.5
      this._waterNoiseSprite.y += 2
    }
  }

  private _shockWave(_hex: hex.Hex) {
    const intervals = 200

    const firstNeighbors = this._getNeighbors(_hex)
    const secondNeighbors = firstNeighbors
      .filter((__hex) => __hex !== null)
      .map((__hex) => this._getNeighbors(__hex))
      .flat()
      .filter((__hex) => !firstNeighbors.includes(__hex) && __hex !== _hex)

    const cells = [
      [this._hexToCell(_hex)],
      firstNeighbors.map((neighbor) => this._hexToCell(neighbor)),
      secondNeighbors.map((neighbor) => this._hexToCell(neighbor)),
    ]

    this._activateChildChip(
      new booyah.Sequence([
        new booyah.Lambda(() => {
          cells[0][0].emit("pulse", 1)
        }),
        new booyah.Wait(intervals / 3),
        new booyah.Parallel(
          cells[1].map((cell) => {
            return new booyah.Lambda(() => {
              cell.emit("pulse", 0.5)
            })
          }),
        ),
        new booyah.Wait(intervals / 3),
        new booyah.Parallel(
          cells[2].map((cell) => {
            return new booyah.Lambda(() => {
              cell.emit("pulse", 0.25)
            })
          }),
        ),
      ]),
    )
  }

  private _getNeighbors(_hex: hex.Hex) {
    const neighbors = new Array<hex.Hex | undefined>()

    for (let i = 0; i < 7; i++) {
      neighbors.push(this._grid.neighborOf(_hex, i, { allowOutside: false }))
    }

    return neighbors.filter((neighbor) => !!neighbor) as hex.Hex[]
  }

  private _hexToCell(_hex: hex.Hex) {
    return this._cells.find((cell) => cell.hex === _hex)!
  }
}
