import * as booyah from "@ghom/booyah"
import * as pixi from "pixi.js"
import * as pf from "pathfinding"
import * as utils from "../utils"
import * as enums from "../enums"
import * as constants from "../constants"

// @ts-ignore
import hill from "../../assets/images/grid-cells/hill.png"

import GridCell from "./GridCell"
import ContainerChip from "../extensions/ContainerChip"

interface GridEvents extends booyah.BaseCompositeEvents {
  leftClick: [cell: GridCell]
  rightClick: [cell: GridCell]
  drag: [cell: GridCell]
  drop: [cell: GridCell]
  dragAndDrop: [from: GridCell, to: GridCell]
  ready: []
}

export default class Grid extends ContainerChip<GridEvents> {
  private _cells!: GridCell[]
  private _pfGrid!: pf.Grid

  protected _onActivate() {
    this._container.sortableChildren = true

    const hillTexture = pixi.Texture.from(hill)

    let z = 0

    this._pfGrid = new pf.Grid(constants.gridWidth, constants.gridHeight)

    this._cells = []

    for (let row = constants.gridHeight; row >= 0; row--) {
      for (let col = constants.gridWidth; col >= 0; col--) {
        const cell = new GridCell(col, row, z, hillTexture, row * col * 10)

        this._cells.push(cell)

        this._activateChildChip(cell)

        // if (Math.random() < 0.1) {
        //   z++
        // }

        this._subscribe(cell, "reachable", (isReachable) => {
          this._pfGrid.setWalkableAt(col, row, isReachable)
        })

        this._subscribe(cell, "leftClick", () => {
          this.emit("leftClick", cell)
        })

        this._subscribe(cell, "rightClick", () => {
          this.emit("rightClick", cell)
        })

        this._subscribe(cell, "drag", () => {
          this.emit("drag", cell)
        })

        this._subscribe(cell, "drop", (outside) => {
          this.emit("drop", cell)

          if (outside) {
            const hovered = this.getHoveredCell()

            if (hovered) {
              this.emit("dragAndDrop", cell, hovered)
            }
          }
        })
      }
    }
  }

  public getPlacement(
    teamIndex: number,
    characterIndex: number,
  ): pixi.IPointData {
    return {
      x: 2 + teamIndex * (constants.gridWidth - 4),
      y: Math.ceil(constants.gridHeight / 2) + characterIndex,
    }
  }

  public getRandomCell() {
    return this._cells[Math.floor(Math.random() * this._cells.length)]
  }

  public getHoveredCell() {
    return this._cells.find((cell) => cell.isHovered)
  }

  public shockWave(position: pixi.IPointData) {
    const intervals = 200

    const center = this.getCell(position)

    if (!center) return

    const firstNeighbors = this.getRange(position, 1)
    const secondNeighbors = this.getRange(position, 2)

    this._activateChildChip(
      new booyah.Sequence([
        new booyah.Lambda(() => {
          center.pulse(1)
        }),
        new booyah.Wait(intervals / 3),
        new booyah.Parallel(
          firstNeighbors.map((cell) => {
            return cell
              ? new booyah.Lambda(() => {
                  cell.pulse(0.5)
                })
              : new booyah.Transitory()
          }),
        ),
        new booyah.Wait(intervals / 3),
        new booyah.Parallel(
          secondNeighbors.map((cell) => {
            return cell
              ? new booyah.Lambda(() => {
                  cell.pulse(0.25)
                })
              : new booyah.Transitory()
          }),
        ),
      ]),
    )
  }

  public getNeighbor(
    position: pixi.IPointData,
    direction: enums.Direction,
  ): GridCell | null {
    return this.getCell({
      x: position.x + utils.directionCoordinates[direction].x,
      y: position.y + utils.directionCoordinates[direction].y,
    })
  }

  public getNeighbors(position: pixi.IPointData): (GridCell | null)[] {
    return [
      this.getNeighbor(position, enums.Direction.N),
      this.getNeighbor(position, enums.Direction.E),
      this.getNeighbor(position, enums.Direction.S),
      this.getNeighbor(position, enums.Direction.W),
    ]
  }

  public getAround(position: pixi.IPointData): (GridCell | null)[] {
    return [
      ...this.getNeighbors(position),
      this.getCell({ x: position.x - 1, y: position.y - 1 }),
      this.getCell({ x: position.x + 1, y: position.y - 1 }),
      this.getCell({ x: position.x - 1, y: position.y + 1 }),
      this.getCell({ x: position.x + 1, y: position.y + 1 }),
    ]
  }

  public getRange(
    position: pixi.IPointData,
    range: number,
  ): (GridCell | null)[] {
    if (range === 0) return [this.getCell(position)]

    const neighbors = this.getNeighbors(position)

    return [
      ...neighbors,
      ...neighbors.flatMap((neighbor) =>
        neighbor ? this.getRange(neighbor.cellPosition, range - 1) : null,
      ),
    ]
  }

  public getCell(position: pixi.IPointData): GridCell | null {
    return (
      this._cells.find(
        (cell) => cell.col === position.x && cell.row === position.y,
      ) || null
    )
  }

  public getCells() {
    return this._cells
  }

  public getDistanceBetween(a: pixi.IPointData, b: pixi.IPointData) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
  }

  public getPathBetween(
    from: pixi.IPointData,
    to: pixi.IPointData,
  ): pixi.IPointData[] | null {
    const path = new pf.BestFirstFinder({
      heuristic: pf.Heuristic.euclidean,
      diagonalMovement: pf.DiagonalMovement.Never,
    }).findPath(from.x, from.y, to.x, to.y, this._pfGrid.clone())

    if (!path) return null

    return path.map((position) => ({ x: position[0], y: position[1] }))
  }
}
