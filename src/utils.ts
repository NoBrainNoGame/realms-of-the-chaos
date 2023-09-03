import * as hex from "honeycomb-grid"
import * as pixi from "pixi.js"

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
