import * as pixi from "pixi.js"
import * as enums from "./enums"
import * as constants from "./constants"

export function clone<Obj>(obj: Obj): Obj {
  return JSON.parse(JSON.stringify(obj))
}

export function times<Value>(
  count: number,
  generator: (index: number) => Value,
): Value[] {
  return new Array(count).fill(0).map((_, index) => generator(index))
}

export const directionCoordinates: Record<enums.Direction, pixi.IPointData> = {
  [enums.Direction.N]: { x: 0, y: -1 },
  [enums.Direction.E]: { x: 1, y: 0 },
  [enums.Direction.S]: { x: 0, y: 1 },
  [enums.Direction.W]: { x: -1, y: 0 },
}

export function isometricToScreen(position: pixi.IPointData): pixi.IPointData {
  return {
    x: (position.x - position.y) * (constants.cellWidth / 2),
    y: (position.x + position.y) * (constants.cellHeight / 2),
  }
}

export function screenToIsometric(position: pixi.IPointData): pixi.IPointData {
  return {
    x:
      (position.x / (constants.cellWidth / 2) +
        position.y / (constants.cellHeight / 2)) /
      2,
    y:
      (position.y / (constants.cellHeight / 2) -
        position.x / (constants.cellWidth / 2)) /
      2,
  }
}
