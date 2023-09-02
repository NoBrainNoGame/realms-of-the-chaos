import * as hex from "honeycomb-grid"
import * as pixi from "pixi.js"

export function hexToPolygon(_hex: hex.Hex): pixi.IPointData[] {
  return _hex.corners.map((corner) => {
    return corner
  })
}
