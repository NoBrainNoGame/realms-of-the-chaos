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

export class Vector {
  constructor(
    public x: number = 0,
    public y: number = 0,
    public z: number = 0,
  ) {}

  get s() {
    return this.x
  }

  get r() {
    return this.y
  }

  get q() {
    return this.z
  }
}
