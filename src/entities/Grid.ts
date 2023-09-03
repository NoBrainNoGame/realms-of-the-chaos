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
import Character from "./Character"

interface GridEvents extends booyah.BaseCompositeEvents {
  leftClick: [cell: GridCell]
  rightClick: [cell: GridCell]
  ready: []
}

export default class Grid extends ContainerChip<GridEvents> {
  private _grid!: hex.Grid<hex.Hex>
  private _cells!: GridCell[]
  private _centerContainer!: pixi.Container
  private _cellContainer!: pixi.Container
  private _waterContainer!: pixi.Container
  private _isReady!: boolean

  private _waterNoiseSprite?: pixi.Sprite

  get isReady() {
    return this._isReady
  }

  protected _onActivate() {
    this._isReady = false

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
        const cell = new GridCell(
          hex,
          hillTexture,
          z,
          this._waterContainer,
          hex.row * hex.col * 10,
        )

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
          this.emit("leftClick", cell)
        })

        this._subscribe(cell, "rightClick", () => {
          this.emit("rightClick", cell)
        })

        this._subscribe(cell, "ready", () => {
          if (this._cells.every((cell) => cell.isReady)) {
            this._isReady = true

            this.emit("ready")
          }
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

  public getPlacement(
    teamIndex: number,
    characterIndex: number,
  ): hex.OffsetCoordinates {
    return {
      col: 2 + teamIndex * constants.gridWidth - 2,
      row: Math.ceil(constants.gridHeight / 2) + characterIndex,
    }
  }

  public getRandomCell() {
    return this._cells[Math.floor(Math.random() * this._cells.length)]
  }

  public shockWave(_hex: hex.Hex) {
    const intervals = 200

    const firstNeighbors = this._getNeighbors(_hex)

    const secondNeighbors = firstNeighbors
      .map((__hex) => this._getNeighbors(__hex))
      .flat()
      .filter(
        (__hex) =>
          !firstNeighbors.some((___hex) => ___hex.equals(__hex)) &&
          !__hex.equals(_hex),
      )

    const cells = [
      [this._hexToCell(_hex)],
      firstNeighbors.map((neighbor) => this._hexToCell(neighbor)),
      secondNeighbors.map((neighbor) => this._hexToCell(neighbor)),
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

  private _getNeighbors(_hex: hex.Hex) {
    const neighbors = new Array<hex.Hex | undefined>()

    for (let i = 0; i < 8; i++) {
      neighbors.push(this._grid.neighborOf(_hex, i, { allowOutside: false }))
    }

    return neighbors.filter((neighbor) => !!neighbor) as hex.Hex[]
  }

  private _hexToCell(_hex: hex.Hex) {
    return this._cells.find((cell) => cell.hex === _hex)!
  }

  /**
   * Add a character to the grid and activate it in GridCell.
   * @param character
   * @param position
   */
  public addCharacter(character: Character, position: hex.OffsetCoordinates) {
    const _hex = this._grid.getHex(position)

    if (!_hex) throw new Error("Invalid position")

    const cell = this._hexToCell(_hex)

    cell.addCharacter(character)
  }

  public removeCharacter(character: Character) {
    const cell = this._cells.find((cell) => cell.hasCharacter(character))!

    cell.removeCharacter(character)
  }
}
