import * as pixi from "pixi.js"
import * as enums from "./enums"

export function hexToPolygon(_hex: hex.Hex): pixi.Polygon {
  return new pixi.Polygon(
    _hex.corners.map((corner) => {
      return corner
    }),
  )
}

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
