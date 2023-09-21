import * as booyah from "@ghom/booyah"
import * as hex from "honeycomb-grid"
import * as pixi from "pixi.js"
import * as utils from "../utils"
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

        this._subscribe(cell, "dragEnd", (outside) => {
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

    const firstNeighbors = this.getRangedCells(_hex, 1)
    const secondNeighbors = this.getRangedCells(_hex, 2)

    this._activateChildChip(
      new booyah.Sequence([
        new booyah.Lambda(() => {
          this.getCell(_hex).pulse(1)
        }),
        new booyah.Wait(intervals / 3),
        new booyah.Parallel(
          firstNeighbors.map((cell) => {
            return new booyah.Lambda(() => {
              cell.pulse(0.5)
            })
          }),
        ),
        new booyah.Wait(intervals / 3),
        new booyah.Parallel(
          secondNeighbors.map((cell) => {
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

    neighbors.push(
      this._honeycomb.neighborOf(_hex, hex.Direction.E, {
        allowOutside: false,
      }),
      this._honeycomb.neighborOf(_hex, hex.Direction.NE, {
        allowOutside: false,
      }),
      this._honeycomb.neighborOf(_hex, hex.Direction.E, {
        allowOutside: false,
      }),
      this._honeycomb.neighborOf(_hex, hex.Direction.SE, {
        allowOutside: false,
      }),
      this._honeycomb.neighborOf(_hex, hex.Direction.SW, {
        allowOutside: false,
      }),
      this._honeycomb.neighborOf(_hex, hex.Direction.W, {
        allowOutside: false,
      }),
      this._honeycomb.neighborOf(_hex, hex.Direction.NW, {
        allowOutside: false,
      }),
    )

    return neighbors.filter((neighbor) => !!neighbor) as hex.Hex[]
  }

  public getNeighborsByRange(center: hex.Hex, range: number): GridCell[] {
    if (range === 0) return []

    const neighbors: GridCell[] = []

    for (let i = 1; i < range + 1; i++) {
      neighbors.push(...this.getRangedCells(center, i))
    }

    return neighbors
  }

  public getRangedCells(_hex: hex.Hex, range: number): GridCell[] {
    return this._cells.filter((cell) => {
      const distance = this._honeycomb.distance(_hex, cell.hex)
      return distance === range
    })
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

  public getPathBetween(origin: GridCell, target: GridCell): GridCell[] | null {
    const openList: [number, GridCell][] = [[0, origin]] // [f, cell]
    const closedSet: Set<GridCell> = new Set()

    const gScores: Map<GridCell, number> = new Map()

    this._cells.forEach((cell) => {
      gScores.set(cell, Infinity)
    })

    gScores.set(origin, 0)

    const parents: Map<GridCell, GridCell | null> = new Map()

    while (openList.length > 0) {
      openList.sort((a, b) => a[0] - b[0])
      const [_, currentCell] = openList.shift()!

      if (currentCell === target) {
        // Reconstruction du chemin
        const path: GridCell[] = []
        let cell: GridCell | null = target
        while (cell !== null) {
          path.unshift(cell)
          cell = parents.get(cell) || null
        }

        return path
      }

      closedSet.add(currentCell)

      for (const neighbor of this.getNeighbors(currentCell.hex)) {
        const neighborCell = this.getCell(neighbor)

        if (!neighborCell || closedSet.has(neighborCell)) {
          continue
        }

        const tentativeGScore =
          gScores.get(currentCell)! +
          hex.distance(this._honeycomb.hexPrototype, currentCell.hex, neighbor)

        if (
          !openList.some(([_, cell]) => cell.hex.equals(neighborCell.hex)) ||
          tentativeGScore < gScores.get(neighborCell)!
        ) {
          parents.set(neighborCell, currentCell)
          gScores.set(neighborCell, tentativeGScore)
          const fScore = tentativeGScore + heuristic(neighborCell, target)
          openList.push([fScore, neighborCell])
        }
      }
    }

    // Aucun chemin trouvé
    return null
  }

  public getReachableCellsByRange(
    origin: GridCell,
    range: number,
  ): GridCell[] | null {
    // todo: use the path finder to implement this method
    return null
  }

  public canReachNeighbor(_hex: hex.Hex, direction: hex.Direction): boolean {
    const neighbor = this._honeycomb.neighborOf(_hex, direction, {
      allowOutside: false,
    })

    if (!neighbor) return false

    const _cell = this.getCell(_hex)
    const cell = this.getCell(neighbor)

    return Math.abs(cell.z - _cell.z) <= 1
  }
}

/// GENERATED BY AI ///

function heuristic(cell: GridCell, target: GridCell): number {
  // Fonction heuristique pour estimer le coût restant
  // Utilisez une distance euclidienne, mais vous pouvez ajuster cela en fonction de vos besoins
  const vec = subtract(cell.hex, target.hex)

  return (Math.abs(vec.q) + Math.abs(vec.r) + Math.abs(vec.s)) / 2
}

function subtract(a: hex.Hex, b: hex.Hex): utils.Vector {
  return new utils.Vector(a.q - b.q, a.r - b.r, a.s - b.s)
}
